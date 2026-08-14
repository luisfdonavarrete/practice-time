import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';
import { IsSevenDayRange } from './validators/is-seven-day-range.decorator';
import { CreateAssignmentNoticeDto } from './create-assignment-notice.dto';
import { CreateAssignmentSectionDto } from './create-assignment-section.dto';

export class CreateStudentAssignmentDto {
  @IsUUID()
  studentId: string;

  @IsNotEmpty()
  @IsString()
  @NormalizeString({ trim: true })
  title: string;

  @IsOptional()
  @IsString()
  @NormalizeString({ trim: true })
  description?: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  startDate: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  @IsSevenDayRange('startDate')
  endDate: string;

  @IsArray()
  @ArrayUnique((notice: CreateAssignmentNoticeDto) => notice.position)
  @ValidateNested({ each: true })
  @Type(() => CreateAssignmentNoticeDto)
  notices: CreateAssignmentNoticeDto[] = [];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((section: CreateAssignmentSectionDto) => section.position)
  @ValidateNested({ each: true })
  @Type(() => CreateAssignmentSectionDto)
  sections: CreateAssignmentSectionDto[];
}
