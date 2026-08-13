import { Injectable } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { HashingService } from '../hashing/hashing.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { LoginFailedException } from './exceptions/login-failed.exception';
import { JwtPayloadDto } from './dto/jwt-payload.dto';

const DUMMY_PASSWORD_HASH =
  '$2b$10$hXeg8XU80IpaMaHdTephruVL4Ea9Fh2waFUPnWgfjUzx2cRjx1pji';

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

  getCurrentUser(userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }

  async signIn(loginDto: LoginDto): Promise<string> {
    const user = await this.usersService.findOneByEmail(loginDto.email);
    const valid = await this.hashingService.compare(
      loginDto.password,
      user?.password ?? DUMMY_PASSWORD_HASH,
    );
    if (!user || !user.isActive || !valid) {
      throw new LoginFailedException();
    }
    const payload: JwtPayloadDto = { sub: user.id };
    return this.jwtService.signAsync(payload);
  }
}
