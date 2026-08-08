import 'reflect-metadata';
import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserDto', () => {
  it('accepts an update with omitted fields', async () => {
    await expect(validate(new UpdateUserDto())).resolves.toHaveLength(0);
  });

  it.each(['firstName', 'lastName', 'dateOfBirth'] as const)(
    'rejects null for %s',
    async (property) => {
      const dto = Object.assign(new UpdateUserDto(), { [property]: null });

      const errors = await validate(dto);

      expect(errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ property })]),
      );
    },
  );
});
