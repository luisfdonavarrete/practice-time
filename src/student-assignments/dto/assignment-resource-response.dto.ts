import { Exclude, Expose } from 'class-transformer';
import { AssignmentResourceKind } from '../entities/assignment-item-resource.entity';

@Exclude()
export class AssignmentResourceResponseDto {
  @Expose()
  id: string;

  @Expose()
  kind: AssignmentResourceKind;

  @Expose()
  displayName: string;

  @Expose()
  assetKey: string | null;

  @Expose()
  url: string | null;

  @Expose()
  position: number;
}
