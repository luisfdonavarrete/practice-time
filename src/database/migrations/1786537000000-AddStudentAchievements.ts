import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentAchievements1786537000000 implements MigrationInterface {
  name = 'AddStudentAchievements1786537000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."student_achievements_achievement_key_enum"
      AS ENUM('first_practice', 'weekly_60_minutes', 'three_day_streak',
              'seven_day_streak', 'first_assignment_complete')`);
    await queryRunner.query(`CREATE TABLE "student_achievements" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "student_id" uuid NOT NULL,
      "achievement_key" "public"."student_achievements_achievement_key_enum" NOT NULL,
      "unlocked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_student_achievement_key" UNIQUE ("student_id", "achievement_key"),
      CONSTRAINT "PK_student_achievements" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_student_achievements_student_unlocked" ON "student_achievements" ("student_id", "unlocked_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_achievements" ADD CONSTRAINT "FK_student_achievement_student" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "student_achievements"`);
    await queryRunner.query(
      `DROP TYPE "public"."student_achievements_achievement_key_enum"`,
    );
  }
}
