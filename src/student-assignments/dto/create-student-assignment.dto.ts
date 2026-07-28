import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentAssignmentDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  start_date: Date;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  end_date: Date;
}
