import { IsDate, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';

export class CreateStudentDto {
  @NormalizeString({ trim: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  first_name: string;

  @NormalizeString({ trim: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  last_name: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  birthdate: Date;
}
