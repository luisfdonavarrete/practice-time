import { Module } from '@nestjs/common';
import { StudentAssignmentsService } from './student-assignments.service';
import { StudentAssignmentsController } from './student-assignments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentAssignment } from './entities/student-assignment.entity';
import { Student } from '../students/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentAssignment, Student])],
  controllers: [StudentAssignmentsController],
  providers: [StudentAssignmentsService],
})
export class StudentAssignmentsModule {}
