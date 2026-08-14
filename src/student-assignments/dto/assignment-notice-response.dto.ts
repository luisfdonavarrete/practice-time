import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AssignmentNoticeResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  occursAt: Date | null;

  @Expose()
  location: string | null;

  @Expose()
  details: string | null;

  @Expose()
  position: number;
}
