import { Exclude, Expose } from 'class-transformer';

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
  startDate: Date;

  @Expose()
  endDate: Date;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}
