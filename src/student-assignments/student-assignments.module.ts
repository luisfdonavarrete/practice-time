import { Module } from '@nestjs/common';
import { StudentAssignmentsService } from './student-assignments.service';
import { StudentAssignmentsController } from './student-assignments.controller';

@Module({
  controllers: [StudentAssignmentsController],
  providers: [StudentAssignmentsService],
})
export class StudentAssignmentsModule {}
