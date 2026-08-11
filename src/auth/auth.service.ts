import { Injectable } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { HashingService } from '../hashing/hashing.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { LoginFailedException } from './exceptions/login-failed.exception';
import { JwtPayloadDto } from './dto/jwt-payload.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
  ) {}

  signUp(signUpDto: SignUpDto): Promise<User> {
    return this.usersService.create(signUpDto);
  }

  async signIn(loginDto: LoginDto): Promise<string> {
    const user = await this.usersService.findOneByEmail(loginDto.email);
    if (!user) {
      throw new LoginFailedException();
    }
    const valid = await this.hashingService.compare(
      loginDto.password,
      user.password,
    );
    if (!valid) {
      throw new LoginFailedException();
    }
    const payload: JwtPayloadDto = { sub: user.id };
    return this.jwtService.signAsync(payload);
  }
}
