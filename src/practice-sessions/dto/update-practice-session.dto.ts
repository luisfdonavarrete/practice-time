import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';

export class UpdatePracticeSessionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  practicedAt?: Date;

  @IsOptional()
  @NormalizeString({ trim: true })
  @IsString()
  @MaxLength(2000)
  note?: string | null;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  assignmentItemId?: string | null;
}
