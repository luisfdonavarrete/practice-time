import { QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { DuplicateEmailException } from './exceptions/duplicate-email.exception';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let repository: jest.Mocked<Repository<User>>;
  let service: UsersService;
  let create: jest.Mock;
  let save: jest.Mock;

  const createUserDto: CreateUserDto = {
    email: 'student@example.com',
    password: 'StrongPassword123!',
    firstName: 'Test',
    lastName: 'Student',
    dateOfBirth: new Date('2000-01-01'),
  };

  const user = {
    ...createUserDto,
    id: '018f0542-f7c8-7d56-a4c8-53bffd426a9a',
    createdAt: new Date(),
    updatedAt: new Date(),
    studentAccesses: [],
  } as User;

  beforeEach(() => {
    create = jest.fn();
    save = jest.fn();
    repository = {
      create,
      save,
      findOneBy: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;
    service = new UsersService(repository);
  });

  it('translates a unique violation to a duplicate email exception', async () => {
    const driverError = Object.assign(new Error('duplicate key'), {
      code: '23505',
    });
    repository.create.mockReturnValue(user);
    repository.save.mockRejectedValue(
      new QueryFailedError('INSERT', [], driverError),
    );

    await expect(service.create(createUserDto)).rejects.toBeInstanceOf(
      DuplicateEmailException,
    );
  });

  it('rethrows non-unique query failures', async () => {
    const driverError = Object.assign(new Error('database unavailable'), {
      code: '08006',
    });
    const queryError = new QueryFailedError('INSERT', [], driverError);
    repository.create.mockReturnValue(user);
    repository.save.mockRejectedValue(queryError);

    await expect(service.create(createUserDto)).rejects.toBe(queryError);
  });

  it('rethrows errors that are not query failures', async () => {
    const error = new Error('unexpected failure');
    repository.create.mockReturnValue(user);
    repository.save.mockRejectedValue(error);

    await expect(service.create(createUserDto)).rejects.toBe(error);
  });
});
