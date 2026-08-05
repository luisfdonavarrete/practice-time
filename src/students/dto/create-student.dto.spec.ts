import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateStudentDto } from './create-student.dto';

describe('CreateStudentDto', () => {
  it('trims names and transforms a valid birthdate', async () => {
    const dto = plainToInstance(CreateStudentDto, {
      first_name: '  Ada  ',
      last_name: '  Lovelace  ',
      birthdate: '1815-12-10T00:00:00.000Z',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({ first_name: 'Ada', last_name: 'Lovelace' });
    expect(dto.birthdate).toBeInstanceOf(Date);
  });

  it.each([
    ['blank first name', { first_name: '   ' }],
    ['oversized first name', { first_name: 'a'.repeat(256) }],
    ['invalid birthdate', { birthdate: 'not-a-date' }],
  ])('rejects %s', async (_caseName, override) => {
    const dto = plainToInstance(CreateStudentDto, {
      first_name: 'Ada',
      last_name: 'Lovelace',
      birthdate: '1815-12-10T00:00:00.000Z',
      ...override,
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
