import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseMapper } from '../users/mappers/user-response.mapper';
import { UserDto } from '../users/dto/user.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CurrentUser } from './decorators/authenticated-user.decorator';
import { AuthenticatedUser } from './models/authenticated-user';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userResponseMapper: UserResponseMapper,
  ) {}

  @Public()
  @Post('/signup')
  async signup(@Body() signUpDto: SignUpDto): Promise<UserDto> {
    return this.userResponseMapper.toDto(
      await this.authService.signUp(signUpDto),
    );
  }
  @Public()
  @Post('/login')
  async signIn(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return new LoginResponseDto(await this.authService.signIn(loginDto));
  }

  @Get('/me')
  async getProfile(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ): Promise<UserDto> {
    return this.userResponseMapper.toDto(
      await this.authService.getCurrentUser(authenticatedUser.userId),
    );
  }
}
