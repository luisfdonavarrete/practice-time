import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { HashingService } from '../hashing/hashing.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { LoginFailedException } from './exceptions/login-failed.exception';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<
    Pick<UsersService, 'create' | 'findOne' | 'findOneByEmail'>
  >;
  let hashingService: jest.Mocked<Pick<HashingService, 'compare'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;

  const user = {
    id: '6d88f936-dd07-420b-ae65-e33e302d7041',
    email: 'user@example.com',
    password: 'hashed-password',
    isActive: true,
  } as User;
  const loginDto = {
    email: user.email,
    password: 'StrongPassword1!',
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findOne: jest.fn(),
      findOneByEmail: jest.fn(),
    };
    hashingService = { compare: jest.fn() };
    jwtService = { signAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: HashingService, useValue: hashingService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns a signed token for valid credentials', async () => {
    usersService.findOneByEmail.mockResolvedValue(user);
    hashingService.compare.mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('signed-token');

    await expect(service.signIn(loginDto)).resolves.toBe('signed-token');
    expect(hashingService.compare).toHaveBeenCalledWith(
      loginDto.password,
      user.password,
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
    });
  });

  it('rejects an unknown email after a dummy password comparison', async () => {
    usersService.findOneByEmail.mockResolvedValue(null);

    await expect(service.signIn(loginDto)).rejects.toBeInstanceOf(
      LoginFailedException,
    );
    expect(hashingService.compare).toHaveBeenCalledWith(
      loginDto.password,
      expect.stringMatching(/^\$2b\$/),
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an invalid password without signing a token', async () => {
    usersService.findOneByEmail.mockResolvedValue(user);
    hashingService.compare.mockResolvedValue(false);

    await expect(service.signIn(loginDto)).rejects.toBeInstanceOf(
      LoginFailedException,
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
