import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ListPracticeSessionsQueryDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  assignmentItemId?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  practiceLocalDate?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  practicedFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  practicedTo?: Date;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
