import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDailyPracticeXpLedger1786536000000 implements MigrationInterface {
  name = 'AddDailyPracticeXpLedger1786536000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "daily_practice_xp_awards" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "student_id" uuid NOT NULL,
      "practice_local_date" date NOT NULL,
      "xp_amount" smallint NOT NULL DEFAULT 10,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_daily_practice_xp_student_date" UNIQUE ("student_id", "practice_local_date"),
      CONSTRAINT "CHK_daily_practice_xp_amount" CHECK (xp_amount > 0),
      CONSTRAINT "PK_daily_practice_xp_awards" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_daily_practice_xp_student_date" ON "daily_practice_xp_awards" ("student_id", "practice_local_date")`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_practice_xp_awards" ADD CONSTRAINT "FK_daily_practice_xp_student" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(`INSERT INTO "daily_practice_xp_awards"
      ("student_id", "practice_local_date")
      SELECT DISTINCT "student_id", "practice_local_date"
      FROM "practice_sessions"
      ON CONFLICT ("student_id", "practice_local_date") DO NOTHING`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "daily_practice_xp_awards"`);
  }
}
