import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1786448651485 implements MigrationInterface {
  name = 'InitialSchema1786448651485';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "student_assignments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "description" character varying,
                "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_68bdf53d58e2ff92668cd2f7037" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "student" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid,
                "first_name" character varying NOT NULL,
                "last_name" character varying NOT NULL,
                "date_of_birth" TIMESTAMP WITH TIME ZONE NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_3d8016e1cb58429474a3c041904" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(255) NOT NULL,
                "password" character varying(255) NOT NULL,
                "first_name" character varying(100) NOT NULL,
                "last_name" character varying(100) NOT NULL,
                "date_of_birth" TIMESTAMP WITH TIME ZONE NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."student_users_relationship_enum" AS ENUM('self', 'parent', 'guardian', 'caregiver', 'other')
        `);
    await queryRunner.query(`
            CREATE TABLE "student_users" (
                "student_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "relationship" "public"."student_users_relationship_enum" NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_d4690688b6fb68294ddfa5b7bc3" PRIMARY KEY ("student_id", "user_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_student_users_user_id" ON "student_users" ("user_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "student_users"
            ADD CONSTRAINT "FK_5cf595c59756fd1dc04923aea77" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "student_users"
            ADD CONSTRAINT "FK_cea314fab249527ae89e9469548" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "student_users" DROP CONSTRAINT "FK_cea314fab249527ae89e9469548"
        `);
    await queryRunner.query(`
            ALTER TABLE "student_users" DROP CONSTRAINT "FK_5cf595c59756fd1dc04923aea77"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_student_users_user_id"
        `);
    await queryRunner.query(`
            DROP TABLE "student_users"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."student_users_relationship_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP TABLE "student"
        `);
    await queryRunner.query(`
            DROP TABLE "student_assignments"
        `);
  }
}
