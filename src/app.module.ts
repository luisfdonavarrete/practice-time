import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StudentAssignmentsModule } from './student-assignments/student-assignments.module';
import { DatabaseModule } from './database/database.module';
import { AppConfigModule } from './app-config/app.config.module';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [
    AppConfigModule,
    StudentAssignmentsModule,
    DatabaseModule,
    StudentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
