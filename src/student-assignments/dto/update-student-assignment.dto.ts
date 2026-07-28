import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentAssignmentDto } from './create-student-assignment.dto';

export class UpdateStudentAssignmentDto extends PartialType(
  CreateStudentAssignmentDto,
) {}
