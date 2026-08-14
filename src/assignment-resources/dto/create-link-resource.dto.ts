import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';
import { AssignmentResourceKind } from '../../student-assignments/entities/assignment-item-resource.entity';

export class CreateLinkResourceDto {
  @IsEnum(AssignmentResourceKind)
  @IsIn([AssignmentResourceKind.EXTERNAL_LINK, AssignmentResourceKind.YOUTUBE])
  kind: AssignmentResourceKind.EXTERNAL_LINK | AssignmentResourceKind.YOUTUBE;

  @NormalizeString({ trim: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName: string;

  @IsString()
  @MaxLength(2048)
  url: string;

  @IsInt()
  @Min(0)
  position: number;
}
