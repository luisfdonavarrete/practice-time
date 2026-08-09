import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';
import { IsAfterDate } from './validators/is-after-date.decorator';

export class CreateStudentAssignmentDto {
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
  start_date: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @IsAfterDate('start_date', {})
  end_date: Date;
}
