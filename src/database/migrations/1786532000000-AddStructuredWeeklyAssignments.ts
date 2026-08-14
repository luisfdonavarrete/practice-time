import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStructuredWeeklyAssignments1786532000000 implements MigrationInterface {
  name = 'AddStructuredWeeklyAssignments1786532000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."student_assignments_status_enum" AS ENUM('draft', 'published', 'archived', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."student_assignment_items_completion_mode_enum" AS ENUM('practice_days', 'one_time')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."assignment_item_resources_kind_enum" AS ENUM('upload', 'external_link', 'youtube')`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assignments" ALTER COLUMN "start_date" TYPE date USING ("start_date" AT TIME ZONE 'UTC')::date`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assignments" ALTER COLUMN "end_date" TYPE date USING ("end_date" AT TIME ZONE 'UTC')::date`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assignments" ADD "status" "public"."student_assignments_status_enum" NOT NULL DEFAULT 'draft'`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assignments" ADD "published_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assignments" ADD "archived_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assignments" ADD CONSTRAINT "CHK_assignment_seven_day_range" CHECK (end_date = start_date + 6)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_assignments_student_dates_status" ON "student_assignments" ("student_id", "start_date", "end_date", "status")`,
    );

    await queryRunner.query(`CREATE TABLE "assignment_notices" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "assignment_id" uuid NOT NULL,
      "title" character varying NOT NULL,
      "occurs_at" TIMESTAMP WITH TIME ZONE,
      "location" character varying,
      "details" text,
      "position" smallint NOT NULL,
      CONSTRAINT "UQ_assignment_notice_position" UNIQUE ("assignment_id", "position"),
      CONSTRAINT "CHK_assignment_notice_position" CHECK (position >= 0),
      CONSTRAINT "PK_assignment_notices" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE TABLE "assignment_sections" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "assignment_id" uuid NOT NULL,
      "title" character varying NOT NULL,
      "position" smallint NOT NULL,
      CONSTRAINT "UQ_assignment_section_position" UNIQUE ("assignment_id", "position"),
      CONSTRAINT "CHK_assignment_section_position" CHECK (position >= 0),
      CONSTRAINT "PK_assignment_sections" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE TABLE "student_assignment_items" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "section_id" uuid NOT NULL,
      "title" character varying NOT NULL,
      "instructions" text,
      "completion_mode" "public"."student_assignment_items_completion_mode_enum" NOT NULL,
      "suggested_practice_days" smallint,
      "due_at" TIMESTAMP WITH TIME ZONE,
      "position" smallint NOT NULL,
      CONSTRAINT "UQ_assignment_item_position" UNIQUE ("section_id", "position"),
      CONSTRAINT "CHK_assignment_item_position" CHECK (position >= 0),
      CONSTRAINT "CHK_assignment_item_mode_target" CHECK ((completion_mode = 'practice_days' AND suggested_practice_days BETWEEN 1 AND 7) OR (completion_mode = 'one_time' AND suggested_practice_days IS NULL)),
      CONSTRAINT "PK_student_assignment_items" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE TABLE "assignment_item_resources" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "item_id" uuid NOT NULL,
      "kind" "public"."assignment_item_resources_kind_enum" NOT NULL,
      "display_name" character varying NOT NULL,
      "asset_key" character varying,
      "url" text,
      "position" smallint NOT NULL,
      CONSTRAINT "UQ_assignment_resource_position" UNIQUE ("item_id", "position"),
      CONSTRAINT "CHK_assignment_resource_position" CHECK (position >= 0),
      CONSTRAINT "CHK_assignment_resource_source" CHECK ((kind = 'upload' AND asset_key IS NOT NULL AND url IS NULL) OR (kind IN ('external_link', 'youtube') AND url IS NOT NULL AND asset_key IS NULL)),
      CONSTRAINT "PK_assignment_item_resources" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE TABLE "assignment_item_completions" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "item_id" uuid NOT NULL,
      "student_id" uuid NOT NULL,
      "completed_by_user_id" uuid NOT NULL,
      "completed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "reopened_at" TIMESTAMP WITH TIME ZONE,
      CONSTRAINT "PK_assignment_item_completions" PRIMARY KEY ("id")
    )`);

    await queryRunner.query(
      `CREATE INDEX "IDX_assignment_notices_assignment" ON "assignment_notices" ("assignment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_assignment_sections_assignment" ON "assignment_sections" ("assignment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_assignment_items_section" ON "student_assignment_items" ("section_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_assignment_resources_item" ON "assignment_item_resources" ("item_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_assignment_completions_student" ON "assignment_item_completions" ("student_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_active_item_completion" ON "assignment_item_completions" ("item_id") WHERE "reopened_at" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "assignment_notices" ADD CONSTRAINT "FK_assignment_notice_assignment" FOREIGN KEY ("assignment_id") REFERENCES "student_assignments"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_sections" ADD CONSTRAINT "FK_assignment_section_assignment" FOREIGN KEY ("assignment_id") REFERENCES "student_assignments"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assignment_items" ADD CONSTRAINT "FK_assignment_item_section" FOREIGN KEY ("section_id") REFERENCES "assignment_sections"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_resources" ADD CONSTRAINT "FK_assignment_resource_item" FOREIGN KEY ("item_id") REFERENCES "student_assignment_items"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_completions" ADD CONSTRAINT "FK_assignment_completion_item" FOREIGN KEY ("item_id") REFERENCES "student_assignment_items"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_completions" ADD CONSTRAINT "FK_assignment_completion_student" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_completions" ADD CONSTRAINT "FK_assignment_completion_user" FOREIGN KEY ("completed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );

    await queryRunner.query(`CREATE FUNCTION validate_assignment_item_completion()
      RETURNS trigger AS $$
      DECLARE
        expected_student_id uuid;
        item_mode text;
      BEGIN
        SELECT assignment.student_id, item.completion_mode::text
          INTO expected_student_id, item_mode
          FROM student_assignment_items item
          JOIN assignment_sections section ON section.id = item.section_id
          JOIN student_assignments assignment ON assignment.id = section.assignment_id
          WHERE item.id = NEW.item_id;
        IF expected_student_id IS NULL OR expected_student_id <> NEW.student_id THEN
          RAISE EXCEPTION 'Completion student must match the assignment student';
        END IF;
        IF item_mode <> 'one_time' THEN
          RAISE EXCEPTION 'Only one-time assignment items may have completion records';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql`);
    await queryRunner.query(`CREATE TRIGGER "TRG_validate_assignment_item_completion"
      BEFORE INSERT OR UPDATE OF item_id, student_id
      ON "assignment_item_completions"
      FOR EACH ROW EXECUTE FUNCTION validate_assignment_item_completion()`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER "TRG_validate_assignment_item_completion" ON "assignment_item_completions"`,
    );
    await queryRunner.query(
      `DROP FUNCTION validate_assignment_item_completion`,
    );
    await queryRunner.query(`DROP TABLE "assignment_item_completions"`);
    await queryRunner.query(`DROP TABLE "assignment_item_resources"`);
    await queryRunner.query(`DROP TABLE "student_assignment_items"`);
    await queryRunner.query(`DROP TABLE "assignment_sections"`);
    await queryRunner.query(`DROP TABLE "assignment_notices"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_assignments_student_dates_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assignments" DROP CONSTRAINT "CHK_assignment_seven_day_range"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assignments" DROP COLUMN "archived_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assignments" DROP COLUMN "published_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assignments" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assignments" ALTER COLUMN "end_date" TYPE TIMESTAMP WITH TIME ZONE USING "end_date"::timestamp AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assignments" ALTER COLUMN "start_date" TYPE TIMESTAMP WITH TIME ZONE USING "start_date"::timestamp AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."assignment_item_resources_kind_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."student_assignment_items_completion_mode_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."student_assignments_status_enum"`,
    );
  }
}
