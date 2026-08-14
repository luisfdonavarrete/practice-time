import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';
import { AssignmentResourceKind } from '../entities/assignment-item-resource.entity';
import { HasValidResourceSource } from './validators/has-valid-resource-source.decorator';

export class CreateAssignmentResourceDto {
  @IsEnum(AssignmentResourceKind)
  @HasValidResourceSource()
  kind: AssignmentResourceKind;

  @NormalizeString({ trim: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  displayName: string;

  @IsOptional()
  @NormalizeString({ trim: true })
  @IsString()
  @MaxLength(1024)
  assetKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  url?: string;

  @IsInt()
  @Min(0)
  position: number;
}
