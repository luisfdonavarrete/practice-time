import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { USER_NAME_MAX_LENGTH } from '../users.constants';

describe('CreateUserDto', () => {
  const createDto = (password: string): CreateUserDto =>
    Object.assign(new CreateUserDto(), {
      firstName: 'Test',
      lastName: 'Student',
      email: 'student@example.com',
      dateOfBirth: new Date('2000-01-01'),
      password,
    });

  it('accepts a strong password at the bcrypt byte limit', async () => {
    const password = `Aa1!${'a'.repeat(68)}`;

    const errors = await validate(createDto(password));

    expect(Buffer.byteLength(password, 'utf8')).toBe(72);
    expect(errors).toHaveLength(0);
  });

  it('rejects a password beyond the bcrypt byte limit', async () => {
    const password = `Aa1!${'a'.repeat(65)}😀`;

    const errors = await validate(createDto(password));
    const passwordError = errors.find((error) => error.property === 'password');

    expect(Buffer.byteLength(password, 'utf8')).toBe(73);
    expect(passwordError?.constraints).toHaveProperty('isByteLength');
  });

  it.each(['firstName', 'lastName'] as const)(
    'rejects %s beyond the database column length',
    async (property) => {
      const dto = createDto('StrongPassword123!');
      dto[property] = 'a'.repeat(USER_NAME_MAX_LENGTH + 1);

      const errors = await validate(dto);
      const nameError = errors.find((error) => error.property === property);

      expect(nameError?.constraints).toHaveProperty('maxLength');
    },
  );

  it('accepts names at the database column length', async () => {
    const dto = createDto('StrongPassword123!');
    dto.firstName = 'a'.repeat(USER_NAME_MAX_LENGTH);
    dto.lastName = 'b'.repeat(USER_NAME_MAX_LENGTH);

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
