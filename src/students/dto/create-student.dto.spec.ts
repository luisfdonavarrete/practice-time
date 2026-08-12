import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateStudentDto } from './create-student.dto';

describe('CreateStudentDto', () => {
  it('trims names and transforms a valid date of birth', async () => {
    const dto = plainToInstance(CreateStudentDto, {
      firstName: '  Ada  ',
      lastName: '  Lovelace  ',
      dateOfBirth: '1815-12-10T00:00:00.000Z',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(dto.dateOfBirth).toBeInstanceOf(Date);
  });

  it.each([
    ['blank first name', { firstName: '   ' }],
    ['oversized first name', { firstName: 'a'.repeat(256) }],
    ['invalid date of birth', { dateOfBirth: 'not-a-date' }],
  ])('rejects %s', async (_caseName, override) => {
    const dto = plainToInstance(CreateStudentDto, {
      firstName: 'Ada',
      lastName: 'Lovelace',
      dateOfBirth: '1815-12-10T00:00:00.000Z',
      ...override,
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
