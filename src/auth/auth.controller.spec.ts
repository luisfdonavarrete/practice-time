import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserResponseMapper } from '../users/mappers/user-response.mapper';
import { User } from '../users/entities/user.entity';
import { LoginResponseDto } from './dto/login-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<
    Pick<AuthService, 'signUp' | 'signIn' | 'getCurrentUser'>
  >;

  const user = {
    id: '6d88f936-dd07-420b-ae65-e33e302d7041',
    email: 'user@example.com',
    password: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: new Date('2000-01-01'),
  } as User;

  beforeEach(async () => {
    authService = {
      signUp: jest.fn(),
      signIn: jest.fn(),
      getCurrentUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        UserResponseMapper,
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('maps a signed-up user without exposing the password', async () => {
    const signUpDto = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: 'StrongPassword1!',
      dateOfBirth: user.dateOfBirth,
    };
    authService.signUp.mockResolvedValue(user);

    const result = await controller.signup(signUpDto);

    expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
    expect(result).toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    expect(result).not.toHaveProperty('password');
  });

  it('returns a typed login response containing the token', async () => {
    const loginDto = {
      email: user.email,
      password: 'StrongPassword1!',
    };
    authService.signIn.mockResolvedValue('signed-token');

    const result = await controller.signIn(loginDto);

    expect(authService.signIn).toHaveBeenCalledWith(loginDto);
    expect(result).toBeInstanceOf(LoginResponseDto);
    expect(result).toEqual({ access_token: 'signed-token' });
  });

  it('returns the current safe user profile', async () => {
    authService.getCurrentUser.mockResolvedValue(user);

    const result = await controller.getProfile({
      userId: user.id,
      email: user.email,
    });

    expect(authService.getCurrentUser).toHaveBeenCalledWith(user.id);
    expect(result).toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  });
});
