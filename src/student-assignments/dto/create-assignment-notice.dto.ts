import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';

export class CreateAssignmentNoticeDto {
  @NormalizeString({ trim: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  occursAt?: Date;

  @IsOptional()
  @NormalizeString({ trim: true })
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @NormalizeString({ trim: true })
  @IsString()
  details?: string;

  @IsInt()
  @Min(0)
  position: number;
}
