import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1786069326000 implements MigrationInterface {
  name = 'InitialSchema1786069326000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE "student_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" character varying,
        "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_assignments" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "student" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "school_id" character varying,
        "user_id" uuid,
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "date_of_birth" TIMESTAMP WITH TIME ZONE NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "school_id" uuid,
        "email" character varying(320) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "first_name" character varying(255) NOT NULL,
        "last_name" character varying(255) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."student_users_relationship_enum" AS ENUM(
        'self',
        'parent',
        'guardian',
        'caregiver',
        'other'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "student_users" (
        "student_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "relationship" "public"."student_users_relationship_enum" NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_users" PRIMARY KEY ("student_id", "user_id"),
        CONSTRAINT "FK_student_users_student" FOREIGN KEY ("student_id")
          REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_student_users_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_student_users_user_id" ON "student_users" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."IDX_student_users_user_id"');
    await queryRunner.query('DROP TABLE "student_users"');
    await queryRunner.query(
      'DROP TYPE "public"."student_users_relationship_enum"',
    );
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TABLE "student"');
    await queryRunner.query('DROP TABLE "student_assignments"');
  }
}
