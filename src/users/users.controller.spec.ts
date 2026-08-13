import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserResponseMapper } from './mappers/user-response.mapper';
import { User } from './entities/user.entity';

describe('UsersController', () => {
  let usersService: jest.Mocked<Pick<UsersService, 'findOne' | 'update'>>;
  let controller: UsersController;

  const authenticatedUser = {
    userId: '018f0542-f7c8-7d56-a4c8-53bffd426a9a',
    email: 'owner@example.com',
  };
  const user = {
    id: authenticatedUser.userId,
    email: authenticatedUser.email,
    firstName: 'Practice',
    lastName: 'Owner',
  } as User;

  beforeEach(() => {
    usersService = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    controller = new UsersController(
      usersService as UsersService,
      new UserResponseMapper(),
    );
  });

  it('returns the profile identified by the authenticated principal', async () => {
    usersService.findOne.mockResolvedValue(user);

    await expect(
      controller.findCurrentUser(authenticatedUser),
    ).resolves.toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    expect(usersService.findOne).toHaveBeenCalledWith(authenticatedUser.userId);
  });

  it('updates the profile identified by the authenticated principal', async () => {
    const update = { firstName: 'Updated' };
    usersService.update.mockResolvedValue({ ...user, ...update });

    await controller.updateCurrentUser(authenticatedUser, update);

    expect(usersService.update).toHaveBeenCalledWith(
      authenticatedUser.userId,
      update,
    );
  });
});
