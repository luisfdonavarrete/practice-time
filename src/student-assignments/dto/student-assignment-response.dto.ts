import { Exclude, Expose } from 'class-transformer';

export class StudentAssignmentResponseDto {
  constructor(partial: Partial<StudentAssignmentResponseDto>) {
    Object.assign(this, partial);
  }

  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description?: string;

  @Expose()
  start_date: Date;

  @Expose()
  end_date: Date;

  @Exclude()
  created_at: Date;

  @Exclude()
  updated_at: Date;
}
