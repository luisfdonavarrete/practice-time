import { Module } from '@nestjs/common';
import { StudentAssignmentsService } from './student-assignments.service';
import { StudentAssignmentsController } from './student-assignments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentAssignment } from './entities/student-assignment.entity';
import { Student } from '../students/entities/student.entity';
import { AssignmentNotice } from './entities/assignment-notice.entity';
import { AssignmentSection } from './entities/assignment-section.entity';
import { StudentAssignmentItem } from './entities/student-assignment-item.entity';
import { AssignmentItemResource } from './entities/assignment-item-resource.entity';
import { AssignmentItemCompletion } from './entities/assignment-item-completion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentAssignment,
      Student,
      AssignmentNotice,
      AssignmentSection,
      StudentAssignmentItem,
      AssignmentItemResource,
      AssignmentItemCompletion,
    ]),
  ],
  controllers: [StudentAssignmentsController],
  providers: [StudentAssignmentsService],
})
export class StudentAssignmentsModule {}
