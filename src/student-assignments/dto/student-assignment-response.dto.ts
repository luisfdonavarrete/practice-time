import { Exclude, Expose } from 'class-transformer';
import { Type } from 'class-transformer';
import { StudentAssignmentStatus } from '../entities/student-assignment.entity';
import { AssignmentNoticeResponseDto } from './assignment-notice-response.dto';
import { AssignmentSectionResponseDto } from './assignment-section-response.dto';

@Exclude()
export class StudentAssignmentResponseDto {
  constructor(partial: Partial<StudentAssignmentResponseDto>) {
    Object.assign(this, partial);
  }

  @Expose()
  id: string;

  @Expose()
  studentId: string;

  @Expose()
  title: string;

  @Expose()
  description?: string;

  @Expose()
  startDate: string;

  @Expose()
  endDate: string;

  @Expose()
  status: StudentAssignmentStatus;

  @Expose()
  publishedAt: Date | null;

  @Expose()
  archivedAt: Date | null;

  @Expose()
  @Type(() => AssignmentNoticeResponseDto)
  notices: AssignmentNoticeResponseDto[];

  @Expose()
  @Type(() => AssignmentSectionResponseDto)
  sections: AssignmentSectionResponseDto[];
}
