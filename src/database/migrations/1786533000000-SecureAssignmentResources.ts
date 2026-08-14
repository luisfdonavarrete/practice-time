import { MigrationInterface, QueryRunner } from 'typeorm';

export class SecureAssignmentResources1786533000000 implements MigrationInterface {
  name = 'SecureAssignmentResources1786533000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment_item_resources" ADD "original_filename" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_resources" ADD "mime_type" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_resources" ADD "byte_size" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_resources" ADD "sha256" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_resources" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "assignment_item_resources" SET "is_active" = false WHERE "kind" = 'upload'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_assignment_resources_asset_key" ON "assignment_item_resources" ("asset_key") WHERE "asset_key" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_resources" DROP CONSTRAINT "CHK_assignment_resource_source"`,
    );
    await queryRunner.query(`ALTER TABLE "assignment_item_resources"
      ADD CONSTRAINT "CHK_assignment_resource_source" CHECK (
        (kind = 'upload' AND asset_key IS NOT NULL AND url IS NULL AND (is_active = false OR (original_filename IS NOT NULL AND mime_type IS NOT NULL AND byte_size > 0 AND sha256 IS NOT NULL)))
        OR
        (kind IN ('external_link', 'youtube') AND url IS NOT NULL AND asset_key IS NULL AND original_filename IS NULL AND mime_type IS NULL AND byte_size IS NULL AND sha256 IS NULL)
      )`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment_item_resources" DROP CONSTRAINT "CHK_assignment_resource_source"`,
    );
    await queryRunner.query(`ALTER TABLE "assignment_item_resources"
      ADD CONSTRAINT "CHK_assignment_resource_source" CHECK ((kind = 'upload' AND asset_key IS NOT NULL AND url IS NULL) OR (kind IN ('external_link', 'youtube') AND url IS NOT NULL AND asset_key IS NULL))`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_assignment_resources_asset_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_resources" DROP COLUMN "sha256"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_resources" DROP COLUMN "byte_size"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_resources" DROP COLUMN "mime_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_resources" DROP COLUMN "original_filename"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment_item_resources" DROP COLUMN "is_active"`,
    );
  }
}
