import dataSource from '../src/database/data-source';
import { AchievementEvents } from '../src/achievements/achievement.events';
import { AchievementsService } from '../src/achievements/achievements.service';
import { AssignmentProgressEvents } from '../src/achievements/assignment-progress.events';
import {
  AchievementKey,
  StudentAchievement,
} from '../src/achievements/entities/student-achievement.entity';
import { PracticeSessionEvents } from '../src/practice-sessions/practice-session.events';
import { Student } from '../src/students/entities/student.entity';

describe('Achievement unlocks with PostgreSQL', () => {
  let service: AchievementsService;
  let achievementEvents: AchievementEvents;
  let userId: string;
  let studentId: string;

  beforeAll(async () => {
    await dataSource.initialize();
    achievementEvents = new AchievementEvents();
    service = new AchievementsService(
      dataSource,
      dataSource.getRepository(StudentAchievement),
      dataSource.getRepository(Student),
      new PracticeSessionEvents(),
      new AssignmentProgressEvents(),
      achievementEvents,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    const userResult: unknown = await dataSource.query(
      `INSERT INTO users
       (email, password, first_name, last_name, date_of_birth)
       VALUES ($1, 'hash', 'Achievement', 'Tester', '1990-01-01') RETURNING id`,
      [`achievement-${crypto.randomUUID()}@example.com`],
    );
    [{ id: userId }] = userResult as Array<{ id: string }>;
    const studentResult: unknown = await dataSource.query(
      `INSERT INTO student
       (owner_user_id, first_name, last_name, date_of_birth, time_zone)
       VALUES ($1, 'Achievement', 'Student', '2010-01-01', 'America/Toronto')
       RETURNING id`,
      [userId],
    );
    [{ id: studentId }] = studentResult as Array<{ id: string }>;
    await dataSource.query(
      `INSERT INTO practice_sessions
       (student_id, recorded_by_user_id, duration_seconds, practiced_at,
        practice_local_date, time_zone_snapshot)
       VALUES ($1, $2, 600, CURRENT_TIMESTAMP,
               (CURRENT_TIMESTAMP AT TIME ZONE 'America/Toronto')::date,
               'America/Toronto')`,
      [studentId, userId],
    );
  });

  afterEach(async () => {
    await dataSource.query(
      `DELETE FROM practice_sessions WHERE student_id = $1`,
      [studentId],
    );
    await dataSource.query(`DELETE FROM student WHERE id = $1`, [studentId]);
    await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
  });

  it('persists and emits one unlock under concurrent evaluation', async () => {
    const emitted: AchievementKey[] = [];
    const subscription = achievementEvents.events$.subscribe((event) =>
      emitted.push(event.achievementKey),
    );

    await Promise.all(
      Array.from({ length: 10 }, () => service.evaluateStudent(studentId)),
    );

    const result: unknown = await dataSource.query(
      `SELECT achievement_key, COUNT(*)::int AS count
       FROM student_achievements WHERE student_id = $1
       GROUP BY achievement_key`,
      [studentId],
    );
    const rows = result as Array<{
      achievement_key: AchievementKey;
      count: number;
    }>;
    expect(rows).toEqual([
      { achievement_key: AchievementKey.FIRST_PRACTICE, count: 1 },
    ]);
    expect(emitted).toEqual([AchievementKey.FIRST_PRACTICE]);
    subscription.unsubscribe();
  });

  it('keeps an earned achievement after its source practice is deleted', async () => {
    await service.evaluateStudent(studentId);
    await dataSource.query(
      `DELETE FROM practice_sessions WHERE student_id = $1`,
      [studentId],
    );
    await service.evaluateStudent(studentId);

    expect(
      await dataSource.getRepository(StudentAchievement).countBy({
        studentId,
        achievementKey: AchievementKey.FIRST_PRACTICE,
      }),
    ).toBe(1);
  });
});
