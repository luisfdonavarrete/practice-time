import {
  IsByteLength,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';
import {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
} from '../../users/users.constants';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';
import { Type } from 'class-transformer';

export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(USER_NAME_MAX_LENGTH)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(USER_NAME_MAX_LENGTH)
  lastName: string;

  @IsNotEmpty()
  @NormalizeString({ trim: true, case: 'lower' })
  @IsEmail()
  @MaxLength(USER_EMAIL_MAX_LENGTH)
  email: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @IsNotEmpty()
  @IsStrongPassword()
  @IsByteLength(0, 72)
  password: string;
}
