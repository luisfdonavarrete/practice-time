import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDate,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';
import { AssignmentCompletionMode } from '../entities/student-assignment-item.entity';
import { CreateAssignmentNoticeDto } from './create-assignment-notice.dto';
import { CreateAssignmentResourceDto } from './create-assignment-resource.dto';
import { HasValidCompletionTarget } from './validators/has-valid-completion-target.decorator';
import { IsSevenDayRange } from './validators/is-seven-day-range.decorator';

export class RetainedAssignmentUploadDto {
  @IsUUID()
  id: string;

  @NormalizeString({ trim: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  displayName: string;

  @IsInt()
  @Min(0)
  position: number;
}

export class UpdateAssignmentItemDto {
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

  @IsArray()
  @ArrayUnique((upload: RetainedAssignmentUploadDto) => upload.id)
  @ValidateNested({ each: true })
  @Type(() => RetainedAssignmentUploadDto)
  retainedUploads: RetainedAssignmentUploadDto[] = [];
}

export class UpdateAssignmentSectionDto {
  @NormalizeString({ trim: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsInt()
  @Min(0)
  position: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: UpdateAssignmentItemDto) => item.position)
  @ValidateNested({ each: true })
  @Type(() => UpdateAssignmentItemDto)
  items: UpdateAssignmentItemDto[];
}

export class UpdateStudentAssignmentDto {
  @IsOptional()
  @NormalizeString({ trim: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @NormalizeString({ trim: true })
  @IsString()
  description?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  startDate?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  @IsSevenDayRange('startDate')
  endDate?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique((notice: CreateAssignmentNoticeDto) => notice.position)
  @ValidateNested({ each: true })
  @Type(() => CreateAssignmentNoticeDto)
  notices?: CreateAssignmentNoticeDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((section: UpdateAssignmentSectionDto) => section.position)
  @ValidateNested({ each: true })
  @Type(() => UpdateAssignmentSectionDto)
  sections?: UpdateAssignmentSectionDto[];
}
