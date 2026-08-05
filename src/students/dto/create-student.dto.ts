import { IsDate, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateStudentDto {
  @Transform(({ value }) => trimString(value))
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  first_name: string;

  @Transform(({ value }) => trimString(value))
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  last_name: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  birthdate: Date;
}
