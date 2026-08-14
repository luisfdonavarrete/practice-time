import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPracticeSessionLedger1786534000000 implements MigrationInterface {
  name = 'AddPracticeSessionLedger1786534000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student" ADD "time_zone" character varying(255) NOT NULL DEFAULT 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "CHK_student_iana_time_zone" CHECK (time_zone = 'UTC' OR time_zone LIKE '%/%')`,
    );
    await queryRunner.query(`CREATE FUNCTION validate_student_time_zone()
      RETURNS trigger AS $$
      BEGIN
        PERFORM now() AT TIME ZONE NEW.time_zone;
        RETURN NEW;
      EXCEPTION WHEN invalid_parameter_value THEN
        RAISE EXCEPTION 'Student time zone must be a valid IANA time zone';
      END;
      $$ LANGUAGE plpgsql`);
    await queryRunner.query(`CREATE TRIGGER "TRG_validate_student_time_zone"
      BEFORE INSERT OR UPDATE OF time_zone
      ON "student"
      FOR EACH ROW EXECUTE FUNCTION validate_student_time_zone()`);

    await queryRunner.query(`CREATE TABLE "practice_sessions" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "student_id" uuid NOT NULL,
      "recorded_by_user_id" uuid NOT NULL,
      "assignment_item_id" uuid,
      "duration_seconds" integer NOT NULL,
      "practiced_at" TIMESTAMP WITH TIME ZONE NOT NULL,
      "practice_local_date" date NOT NULL,
      "time_zone_snapshot" character varying(255) NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "CHK_practice_session_positive_duration" CHECK (duration_seconds > 0),
      CONSTRAINT "CHK_practice_session_iana_time_zone" CHECK (time_zone_snapshot = 'UTC' OR time_zone_snapshot LIKE '%/%'),
      CONSTRAINT "PK_practice_sessions" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_practice_sessions_student_local_date" ON "practice_sessions" ("student_id", "practice_local_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_practice_sessions_student_practiced_at" ON "practice_sessions" ("student_id", "practiced_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_practice_sessions_item_local_date" ON "practice_sessions" ("assignment_item_id", "practice_local_date")`,
    );
    await queryRunner.query(
      `ALTER TABLE "practice_sessions" ADD CONSTRAINT "FK_practice_session_student" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "practice_sessions" ADD CONSTRAINT "FK_practice_session_recorder" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "practice_sessions" ADD CONSTRAINT "FK_practice_session_assignment_item" FOREIGN KEY ("assignment_item_id") REFERENCES "student_assignment_items"("id") ON DELETE SET NULL`,
    );

    await queryRunner.query(`CREATE FUNCTION derive_practice_session_calendar()
      RETURNS trigger AS $$
      DECLARE
        student_time_zone text;
      BEGIN
        IF TG_OP = 'INSERT' THEN
          SELECT time_zone INTO student_time_zone
          FROM student
          WHERE id = NEW.student_id;
          IF student_time_zone IS NULL THEN
            RAISE EXCEPTION 'Practice-session student does not exist';
          END IF;
          PERFORM now() AT TIME ZONE student_time_zone;
          NEW.time_zone_snapshot := student_time_zone;
        ELSE
          IF NEW.student_id IS DISTINCT FROM OLD.student_id THEN
            RAISE EXCEPTION 'Practice-session students are immutable';
          END IF;
          IF NEW.time_zone_snapshot IS DISTINCT FROM OLD.time_zone_snapshot THEN
            RAISE EXCEPTION 'Practice-session time-zone snapshots are immutable';
          END IF;
        END IF;
        NEW.practice_local_date := (NEW.practiced_at AT TIME ZONE NEW.time_zone_snapshot)::date;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql`);
    await queryRunner.query(`CREATE FUNCTION validate_practice_session_item_student()
      RETURNS trigger AS $$
      DECLARE
        assignment_student_id uuid;
      BEGIN
        IF NEW.assignment_item_id IS NULL THEN
          RETURN NEW;
        END IF;
        SELECT assignment.student_id INTO assignment_student_id
        FROM student_assignment_items item
        JOIN assignment_sections section ON section.id = item.section_id
        JOIN student_assignments assignment ON assignment.id = section.assignment_id
        WHERE item.id = NEW.assignment_item_id;
        IF assignment_student_id IS NULL OR assignment_student_id <> NEW.student_id THEN
          RAISE EXCEPTION 'Practice-session item must belong to the same student';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql`);
    await queryRunner.query(`CREATE TRIGGER "TRG_derive_practice_session_calendar"
      BEFORE INSERT OR UPDATE
      ON "practice_sessions"
      FOR EACH ROW EXECUTE FUNCTION derive_practice_session_calendar()`);
    await queryRunner.query(`CREATE TRIGGER "TRG_validate_practice_session_item_student"
      BEFORE INSERT OR UPDATE OF student_id, assignment_item_id
      ON "practice_sessions"
      FOR EACH ROW EXECUTE FUNCTION validate_practice_session_item_student()`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER "TRG_validate_practice_session_item_student" ON "practice_sessions"`,
    );
    await queryRunner.query(
      `DROP TRIGGER "TRG_derive_practice_session_calendar" ON "practice_sessions"`,
    );
    await queryRunner.query(
      `DROP FUNCTION validate_practice_session_item_student`,
    );
    await queryRunner.query(`DROP FUNCTION derive_practice_session_calendar`);
    await queryRunner.query(`DROP TABLE "practice_sessions"`);
    await queryRunner.query(
      `DROP TRIGGER "TRG_validate_student_time_zone" ON "student"`,
    );
    await queryRunner.query(`DROP FUNCTION validate_student_time_zone`);
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT "CHK_student_iana_time_zone"`,
    );
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "time_zone"`);
  }
}
