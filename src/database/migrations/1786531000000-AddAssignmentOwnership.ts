import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignmentOwnership1786531000000 implements MigrationInterface {
  name = 'AddAssignmentOwnership1786531000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "student_assignments" ADD "student_id" uuid',
    );
    await queryRunner.query(
      'ALTER TABLE "student_assignments" ADD "creator_user_id" uuid',
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM "student_assignments") THEN
          RAISE EXCEPTION 'Existing assignments must be assigned to a student before applying this migration';
        END IF;
      END $$
    `);
    await queryRunner.query(
      'ALTER TABLE "student_assignments" ALTER COLUMN "student_id" SET NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "student_assignments" ALTER COLUMN "creator_user_id" SET NOT NULL',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_assignments_student_id" ON "student_assignments" ("student_id")',
    );
    await queryRunner.query(
      'ALTER TABLE "student_assignments" ADD CONSTRAINT "FK_assignment_student" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE',
    );
    await queryRunner.query(
      'ALTER TABLE "student_assignments" ADD CONSTRAINT "FK_assignment_creator" FOREIGN KEY ("creator_user_id") REFERENCES "users"("id") ON DELETE RESTRICT',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "student_assignments" DROP CONSTRAINT "FK_assignment_creator"',
    );
    await queryRunner.query(
      'ALTER TABLE "student_assignments" DROP CONSTRAINT "FK_assignment_student"',
    );
    await queryRunner.query('DROP INDEX "IDX_assignments_student_id"');
    await queryRunner.query(
      'ALTER TABLE "student_assignments" DROP COLUMN "creator_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "student_assignments" DROP COLUMN "student_id"',
    );
  }
}
