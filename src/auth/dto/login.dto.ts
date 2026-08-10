import { NormalizeString } from '../../common/decorators/normalize-string.decorator';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @NormalizeString({ trim: true, case: 'lower' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
