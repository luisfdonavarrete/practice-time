import { Exclude, Expose, Type } from 'class-transformer';
import { AssignmentItemResponseDto } from './assignment-item-response.dto';

@Exclude()
export class AssignmentSectionResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  position: number;

  @Expose()
  @Type(() => AssignmentItemResponseDto)
  items: AssignmentItemResponseDto[];
}
