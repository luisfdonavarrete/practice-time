import 'reflect-metadata';
import { PracticeSessionsService } from './practice-sessions.service';

describe('PracticeSessionsService events', () => {
  const savedSession = {
    id: 'session-id',
    studentId: '11867a48-725c-4764-8d87-d88997396f14',
    recordedByUserId: 'owner-id',
    assignmentItemId: null,
    durationSeconds: 900,
    practicedAt: new Date('2026-08-13T18:00:00.000Z'),
    practiceLocalDate: '2026-08-13',
    timeZoneSnapshot: 'America/Toronto',
    note: null,
  };
  const sessionRepository = {
    create: jest.fn((value: unknown) => value),
    save: jest.fn().mockResolvedValue(savedSession),
    findOneOrFail: jest.fn().mockResolvedValue(savedSession),
  };
  const studentRepository = {
    findOne: jest.fn().mockResolvedValue({ id: savedSession.studentId }),
  };
  const manager = {
    getRepository: jest.fn((entity: { name: string }) =>
      entity.name === 'Student' ? studentRepository : sessionRepository,
    ),
  };
  const dataSource = {
    transaction: jest.fn((work: (manager: typeof manager) => unknown) =>
      work(manager),
    ),
  };
  const events = { publish: jest.fn() };
  const service = new PracticeSessionsService(
    {} as never,
    dataSource as never,
    events as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('publishes stable context only after a successful commit', async () => {
    await expect(
      service.create('owner-id', {
        studentId: savedSession.studentId,
        durationSeconds: 900,
        practicedAt: savedSession.practicedAt,
      }),
    ).resolves.toBe(savedSession);

    expect(events.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'practice-session.created',
        sessionId: savedSession.id,
        studentId: savedSession.studentId,
        assignmentItemId: null,
        practiceLocalDate: savedSession.practiceLocalDate,
      }),
    );
  });

  it('does not publish after a transaction rollback', async () => {
    dataSource.transaction.mockRejectedValueOnce(new Error('rolled back'));

    await expect(
      service.create('owner-id', {
        studentId: savedSession.studentId,
        durationSeconds: 900,
        practicedAt: savedSession.practicedAt,
      }),
    ).rejects.toThrow('rolled back');
    expect(events.publish).not.toHaveBeenCalled();
  });

  it('rejects future sessions before opening a transaction', async () => {
    await expect(
      service.create('owner-id', {
        studentId: savedSession.studentId,
        durationSeconds: 900,
        practicedAt: new Date(Date.now() + 60_000),
      }),
    ).rejects.toThrow('future');
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(events.publish).not.toHaveBeenCalled();
  });
});
