import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StudentAssignmentsModule } from './student-assignments/student-assignments.module';
import { DatabaseModule } from './database/database.module';
import { AppConfigModule } from './app-config/app.config.module';
import { StudentsModule } from './students/students.module';
import { UsersModule } from './users/users.module';
import { APP_FILTER } from '@nestjs/core';
import { DuplicateEmailExceptionFilter } from './users/filters/duplicate-email-exception.filter';
import { EntityNotFoundExceptionFilter } from './common/api/filters/entity-not-found-exception.filter';

@Module({
  imports: [
    AppConfigModule,
    StudentAssignmentsModule,
    DatabaseModule,
    StudentsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: DuplicateEmailExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: EntityNotFoundExceptionFilter,
    },
  ],
})
export class AppModule {}
