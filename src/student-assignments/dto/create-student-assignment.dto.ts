import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';
import { IsAfterDate } from './validators/is-after-date.decorator';

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

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @IsAfterDate('startDate', {})
  endDate: Date;
}
