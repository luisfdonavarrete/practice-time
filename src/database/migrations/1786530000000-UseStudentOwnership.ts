import { MigrationInterface, QueryRunner } from 'typeorm';

export class UseStudentOwnership1786530000000 implements MigrationInterface {
  name = 'UseStudentOwnership1786530000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "student" RENAME COLUMN "user_id" TO "owner_user_id"',
    );
    await queryRunner.query(`
      UPDATE "student" AS student
      SET "owner_user_id" = access."user_id"
      FROM (
        SELECT DISTINCT ON ("student_id") "student_id", "user_id"
        FROM "student_users"
        WHERE "revoked_at" IS NULL
        ORDER BY "student_id", "created_at"
      ) AS access
      WHERE student."id" = access."student_id"
        AND student."owner_user_id" IS NULL
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM "student" WHERE "owner_user_id" IS NULL) THEN
          RAISE EXCEPTION 'Every student must have an owner before applying this migration';
        END IF;
      END $$
    `);
    await queryRunner.query(
      'ALTER TABLE "student" ALTER COLUMN "owner_user_id" SET NOT NULL',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_student_owner_user_id" ON "student" ("owner_user_id")',
    );
    await queryRunner.query(
      'ALTER TABLE "student" ADD CONSTRAINT "FK_student_owner" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE',
    );
    await queryRunner.query('DROP TABLE "student_users"');
    await queryRunner.query(
      'DROP TYPE IF EXISTS "public"."student_users_relationship_enum"',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TYPE \"public\".\"student_users_relationship_enum\" AS ENUM('self', 'parent', 'guardian', 'caregiver', 'other')",
    );
    await queryRunner.query(`
      CREATE TABLE "student_users" (
        "student_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "relationship" "public"."student_users_relationship_enum" NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_users" PRIMARY KEY ("student_id", "user_id"),
        CONSTRAINT "FK_student_users_student" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_student_users_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      INSERT INTO "student_users" ("student_id", "user_id", "relationship")
      SELECT "id", "owner_user_id", 'parent'
      FROM "student"
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_student_users_user_id" ON "student_users" ("user_id")',
    );
    await queryRunner.query(
      'ALTER TABLE "student" DROP CONSTRAINT "FK_student_owner"',
    );
    await queryRunner.query('DROP INDEX "IDX_student_owner_user_id"');
    await queryRunner.query(
      'ALTER TABLE "student" ALTER COLUMN "owner_user_id" DROP NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "student" RENAME COLUMN "owner_user_id" TO "user_id"',
    );
  }
}
