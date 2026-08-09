import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { NormalizeString } from './normalize-string.decorator';

class NormalizedStringsDto {
  @NormalizeString({ trim: true })
  trimmed: unknown;

  @NormalizeString({ case: 'lower' })
  lowercase: unknown;

  @NormalizeString({ case: 'upper' })
  uppercase: unknown;

  @NormalizeString({ trim: true, case: 'lower' })
  email: unknown;
}

describe('NormalizeString', () => {
  it('applies the configured string transformations', () => {
    const dto = plainToInstance(NormalizedStringsDto, {
      trimmed: '  Ada Lovelace  ',
      lowercase: 'Mixed CASE',
      uppercase: 'Mixed case',
      email: '  USER@Example.COM  ',
    });

    expect(dto).toMatchObject({
      trimmed: 'Ada Lovelace',
      lowercase: 'mixed case',
      uppercase: 'MIXED CASE',
      email: 'user@example.com',
    });
  });

  it('leaves non-string values unchanged', () => {
    const value = { nested: true };
    const dto = plainToInstance(NormalizedStringsDto, {
      trimmed: value,
    });

    expect(dto.trimmed).toEqual(value);
  });
});
