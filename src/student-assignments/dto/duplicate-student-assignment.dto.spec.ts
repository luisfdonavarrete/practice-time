import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DuplicateStudentAssignmentDto } from './duplicate-student-assignment.dto';

describe('DuplicateStudentAssignmentDto', () => {
  const validateValue = (startDate: string) =>
    validate(plainToInstance(DuplicateStudentAssignmentDto, { startDate }));

  it('accepts a local calendar date', async () => {
    await expect(validateValue('2026-08-17')).resolves.toEqual([]);
  });

  it('rejects timestamps and impossible dates', async () => {
    await expect(validateValue('2026-08-17T00:00:00Z')).resolves.not.toEqual(
      [],
    );
    await expect(validateValue('2026-02-31')).resolves.not.toEqual([]);
  });
});
