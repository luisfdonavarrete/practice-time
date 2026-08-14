import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPracticeSessionNotes1786535000000 implements MigrationInterface {
  name = 'AddPracticeSessionNotes1786535000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "practice_sessions" ADD "note" text`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "practice_sessions" DROP COLUMN "note"`,
    );
  }
}
