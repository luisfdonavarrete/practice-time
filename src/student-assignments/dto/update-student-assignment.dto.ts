import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateStudentAssignmentDto } from './create-student-assignment.dto';

export class UpdateStudentAssignmentDto extends PartialType(
  OmitType(CreateStudentAssignmentDto, [
    'studentId',
    'startDate',
    'endDate',
    'notices',
    'sections',
  ] as const),
) {}
