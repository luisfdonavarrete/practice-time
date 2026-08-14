import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticeSession } from './entities/practice-session.entity';
import { Student } from '../students/entities/student.entity';
import { StudentAssignmentItem } from '../student-assignments/entities/student-assignment-item.entity';
import { PracticeSessionsController } from './practice-sessions.controller';
import { PracticeSessionsService } from './practice-sessions.service';
import { PracticeSessionEvents } from './practice-session.events';

@Module({
  imports: [
    TypeOrmModule.forFeature([PracticeSession, Student, StudentAssignmentItem]),
  ],
  controllers: [PracticeSessionsController],
  providers: [PracticeSessionsService, PracticeSessionEvents],
  exports: [PracticeSessionsService, PracticeSessionEvents],
})
export class PracticeSessionsModule {}
