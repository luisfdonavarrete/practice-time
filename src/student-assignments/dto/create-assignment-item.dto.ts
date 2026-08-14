import {
  ArrayUnique,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';
import { AssignmentCompletionMode } from '../entities/student-assignment-item.entity';
import { CreateAssignmentResourceDto } from './create-assignment-resource.dto';
import { HasValidCompletionTarget } from './validators/has-valid-completion-target.decorator';

export class CreateAssignmentItemDto {
  @NormalizeString({ trim: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @NormalizeString({ trim: true })
  @IsString()
  instructions?: string;

  @IsEnum(AssignmentCompletionMode)
  @HasValidCompletionTarget()
  completionMode: AssignmentCompletionMode;

  @IsOptional()
  suggestedPracticeDays?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueAt?: Date;

  @IsInt()
  @Min(0)
  position: number;

  @IsArray()
  @ArrayUnique((resource: CreateAssignmentResourceDto) => resource.position)
  @ValidateNested({ each: true })
  @Type(() => CreateAssignmentResourceDto)
  resources: CreateAssignmentResourceDto[] = [];
}
