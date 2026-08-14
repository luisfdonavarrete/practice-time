import { instanceToPlain } from 'class-transformer';
import { PracticeSessionMapper } from './practice-session.mapper';
import { PracticeSession } from './entities/practice-session.entity';

describe('PracticeSessionMapper', () => {
  it('does not expose recorder or relation details', () => {
    const entity = Object.assign(new PracticeSession(), {
      id: 'session-id',
      studentId: 'student-id',
      recordedByUserId: 'private-user-id',
      assignmentItemId: null,
      durationSeconds: 600,
      practicedAt: new Date('2026-08-13T18:00:00.000Z'),
      practiceLocalDate: '2026-08-13',
      timeZoneSnapshot: 'America/Toronto',
      note: null,
      createdAt: new Date('2026-08-13T18:01:00.000Z'),
      recordedBy: { email: 'private@example.com' },
    });

    expect(instanceToPlain(PracticeSessionMapper.toDto(entity))).toEqual({
      id: entity.id,
      studentId: entity.studentId,
      assignmentItemId: null,
      durationSeconds: entity.durationSeconds,
      practicedAt: entity.practicedAt,
      practiceLocalDate: entity.practiceLocalDate,
      timeZoneSnapshot: entity.timeZoneSnapshot,
      note: null,
      createdAt: entity.createdAt,
    });
  });
});
