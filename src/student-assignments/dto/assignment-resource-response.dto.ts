import { Exclude, Expose } from 'class-transformer';
import { AssignmentResourceKind } from '../entities/assignment-item-resource.entity';

@Exclude()
export class AssignmentResourceResponseDto {
  constructor(partial: Partial<AssignmentResourceResponseDto>) {
    Object.assign(this, partial);
  }

  @Expose()
  id: string;

  @Expose()
  kind: AssignmentResourceKind;

  @Expose()
  displayName: string;

  @Expose()
  originalFilename: string | null;

  @Expose()
  mimeType: string | null;

  @Expose()
  byteSize: number | null;

  @Expose()
  isActive: boolean;

  @Expose()
  url: string | null;

  @Expose()
  position: number;
}
