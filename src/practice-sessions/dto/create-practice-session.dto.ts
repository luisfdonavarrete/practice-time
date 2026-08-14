import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';

export class CreatePracticeSessionDto {
  @IsUUID()
  studentId: string;

  @IsInt()
  @Min(1)
  durationSeconds: number;

  @Type(() => Date)
  @IsDate()
  practicedAt: Date;

  @IsOptional()
  @NormalizeString({ trim: true })
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsOptional()
  @IsUUID()
  assignmentItemId?: string;
}
