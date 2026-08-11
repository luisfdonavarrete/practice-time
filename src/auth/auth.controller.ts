import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseMapper } from '../users/mappers/user-response.mapper';
import { UserDto } from '../users/dto/user.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './decorators/authenticated-user.decorator';
import { AuthenticatedUserDto } from './dto/authenticated-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userResponseMapper: UserResponseMapper,
  ) {}

  @Post('/signup')
  async signup(@Body() signUpDto: SignUpDto): Promise<UserDto> {
    return this.userResponseMapper.toDto(
      await this.authService.signUp(signUpDto),
    );
  }

  @Post('/login')
  async signIn(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return new LoginResponseDto(await this.authService.signIn(loginDto));
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  getProfile(
    @CurrentUser() authenticatedUser: AuthenticatedUserDto,
  ): AuthenticatedUserDto {
    return authenticatedUser;
  }
}
