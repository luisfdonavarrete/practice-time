import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PracticeSessionResponseDto {
  @Expose()
  id: string;

  @Expose()
  studentId: string;

  @Expose()
  assignmentItemId: string | null;

  @Expose()
  durationSeconds: number;

  @Expose()
  practicedAt: Date;

  @Expose()
  practiceLocalDate: string;

  @Expose()
  timeZoneSnapshot: string;

  @Expose()
  note: string | null;

  @Expose()
  createdAt: Date;
}
