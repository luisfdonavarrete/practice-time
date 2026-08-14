import { PracticeSessionEvents } from '../practice-sessions/practice-session.events';
import { PracticeXpService } from './practice-xp.service';

describe('PracticeXpService', () => {
  it('awards created/corrected dates and ignores deletion events', async () => {
    const execute = jest.fn().mockResolvedValue({ identifiers: [] });
    const builder = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute,
    };
    const repository = { createQueryBuilder: jest.fn(() => builder) };
    const events = new PracticeSessionEvents();
    const service = new PracticeXpService(repository as never, events);
    service.onModuleInit();

    events.publish({
      type: 'practice-session.created',
      sessionId: 'session-id',
      studentId: 'student-id',
      assignmentItemId: null,
      practiceLocalDate: '2026-08-14',
      occurredAt: new Date().toISOString(),
    });
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(builder.values).toHaveBeenCalledWith({
      studentId: 'student-id',
      practiceLocalDate: '2026-08-14',
      xpAmount: 10,
    });
    expect(execute).toHaveBeenCalledTimes(1);

    events.publish({
      type: 'practice-session.deleted',
      sessionId: 'session-id',
      studentId: 'student-id',
      assignmentItemId: null,
      practiceLocalDate: '2026-08-14',
      occurredAt: new Date().toISOString(),
    });
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(execute).toHaveBeenCalledTimes(1);
    service.onModuleDestroy();
  });
});
