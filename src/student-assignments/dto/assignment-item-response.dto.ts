import { Exclude, Expose, Type } from 'class-transformer';
import { AssignmentCompletionMode } from '../entities/student-assignment-item.entity';
import { AssignmentResourceResponseDto } from './assignment-resource-response.dto';

@Exclude()
export class AssignmentItemResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  instructions: string | null;

  @Expose()
  completionMode: AssignmentCompletionMode;

  @Expose()
  suggestedPracticeDays: number | null;

  @Expose()
  dueAt: Date | null;

  @Expose()
  position: number;

  @Expose()
  @Type(() => AssignmentResourceResponseDto)
  resources: AssignmentResourceResponseDto[];
}
