import { UserDto } from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { UserResponseMapper } from './user-response.mapper';

describe('UserResponseMapper', () => {
  const mapper = new UserResponseMapper();
  const user = {
    id: '6d88f936-dd07-420b-ae65-e33e302d7041',
    email: 'user@example.com',
    password: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: new Date('2000-01-01'),
  } as User;

  it('maps a user to a DTO without sensitive fields', () => {
    const result = mapper.toDto(user);

    expect(result).toBeInstanceOf(UserDto);
    expect(result).toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    expect(result).not.toHaveProperty('password');
  });

  it('maps a list of users', () => {
    expect(mapper.toDtoList([user])).toEqual([mapper.toDto(user)]);
  });
});
