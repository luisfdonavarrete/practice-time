import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentRelationshipRevocation1786450000000 implements MigrationInterface {
  name = 'AddStudentRelationshipRevocation1786450000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "student_users" ADD "revoked_at" TIMESTAMP WITH TIME ZONE',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "student_users" DROP COLUMN "revoked_at"',
    );
  }
}
