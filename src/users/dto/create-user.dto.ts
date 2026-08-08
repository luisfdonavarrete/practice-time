import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsEmailUnique } from '../decodators/is-email-unique-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  @IsEmailUnique()
  email: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @IsNotEmpty()
  @IsStrongPassword()
  password: string;
}
