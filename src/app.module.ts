import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { StudentAssignmentsModule } from './student-assignments/student-assignments.module';
import { DatabaseModule } from './database/database.module';
import { AppConfigModule } from './app-config/app.config.module';
import { StudentsModule } from './students/students.module';
import { UsersModule } from './users/users.module';
import { APP_FILTER } from '@nestjs/core';
import { DuplicateEmailExceptionFilter } from './users/filters/duplicate-email-exception.filter';
import { EntityNotFoundExceptionFilter } from './common/filters/entity-not-found-exception.filter';
import { AuthModule } from './auth/auth.module';
import { LoginFailedExceptionFilter } from './auth/filters/login-failed.exception.filter';
import { AssignmentResourcesModule } from './assignment-resources/assignment-resources.module';
import { PracticeSessionsModule } from './practice-sessions/practice-sessions.module';
import { PracticeProgressModule } from './practice-progress/practice-progress.module';
import { AchievementsModule } from './achievements/achievements.module';

@Module({
  imports: [
    AppConfigModule,
    StudentAssignmentsModule,
    DatabaseModule,
    StudentsModule,
    UsersModule,
    AuthModule,
    AssignmentResourcesModule,
    PracticeSessionsModule,
    PracticeProgressModule,
    AchievementsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DuplicateEmailExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: EntityNotFoundExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: LoginFailedExceptionFilter,
    },
  ],
})
export class AppModule {}
