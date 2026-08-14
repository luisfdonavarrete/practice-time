import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePracticeSessionDto } from './create-practice-session.dto';
import { ListPracticeSessionsQueryDto } from './list-practice-sessions-query.dto';

describe('practice-session DTOs', () => {
  it('transforms and validates a create command', async () => {
    const dto = plainToInstance(CreatePracticeSessionDto, {
      studentId: '11867a48-725c-4764-8d87-d88997396f14',
      assignmentItemId: '49d10df7-55aa-46ce-8671-d138823df66d',
      durationSeconds: 900,
      practicedAt: '2026-08-13T18:00:00.000Z',
      note: '  Scales and arpeggios  ',
    });

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.practicedAt).toBeInstanceOf(Date);
    expect(dto.note).toBe('Scales and arpeggios');
  });

  it('rejects non-positive duration and invalid identifiers', async () => {
    const dto = plainToInstance(CreatePracticeSessionDto, {
      studentId: 'student',
      durationSeconds: 0,
      practicedAt: 'invalid',
    });

    expect(await validate(dto)).toHaveLength(3);
  });

  it('transforms pagination and timestamp filters', async () => {
    const query = plainToInstance(ListPracticeSessionsQueryDto, {
      page: '2',
      limit: '10',
      practicedFrom: '2026-08-01T00:00:00.000Z',
      practiceLocalDate: '2026-08-13',
    });

    await expect(validate(query)).resolves.toEqual([]);
    expect(query).toMatchObject({ page: 2, limit: 10 });
    expect(query.practicedFrom).toBeInstanceOf(Date);
  });
});
