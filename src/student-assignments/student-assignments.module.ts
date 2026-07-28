import { Module } from '@nestjs/common';
import { StudentAssignmentsService } from './student-assignments.service';
import { StudentAssignmentsController } from './student-assignments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentAssignment } from './entities/student-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentAssignment])],
  controllers: [StudentAssignmentsController],
  providers: [StudentAssignmentsService],
})
export class StudentAssignmentsModule {}
