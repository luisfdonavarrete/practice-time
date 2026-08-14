import dataSource from '../src/database/data-source';
import { PracticeProgressService } from '../src/practice-progress/practice-progress.service';

describe('Practice progress PostgreSQL queries', () => {
  let service: PracticeProgressService;
  let userId: string;
  let studentId: string;
  let assignmentId: string;
  let practiceItemId: string;
  let oneTimeItemId: string;
  let today: string;
  let yesterday: string;

  beforeAll(async () => {
    await dataSource.initialize();
    service = new PracticeProgressService(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    [{ today, yesterday }] = await dataSource.query(`SELECT
      (CURRENT_TIMESTAMP AT TIME ZONE 'America/Toronto')::date::text AS today,
      ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Toronto')::date - 1)::text AS yesterday`);
    [{ id: userId }] = await dataSource.query(
      `INSERT INTO users
      (email, password, first_name, last_name, date_of_birth)
      VALUES ($1, 'hash', 'Progress', 'Tester', '1990-01-01') RETURNING id`,
      [`progress-${crypto.randomUUID()}@example.com`],
    );
    [{ id: studentId }] = await dataSource.query(
      `INSERT INTO student
      (owner_user_id, first_name, last_name, date_of_birth, time_zone)
      VALUES ($1, 'Progress', 'Student', '2010-01-01', 'America/Toronto') RETURNING id`,
      [userId],
    );
    [{ id: assignmentId }] = await dataSource.query(
      `INSERT INTO student_assignments
      (student_id, creator_user_id, title, start_date, end_date)
      VALUES ($1, $2, 'Practice week', $3::date - 6, $3::date) RETURNING id`,
      [studentId, userId, today],
    );
    const sectionResult: unknown = await dataSource.query(
      `INSERT INTO assignment_sections
      (assignment_id, title, position) VALUES ($1, 'Repertoire', 0) RETURNING id`,
      [assignmentId],
    );
    const [{ id: sectionId }] = sectionResult as Array<{ id: string }>;
    [{ id: practiceItemId }] = await dataSource.query(
      `INSERT INTO student_assignment_items
      (section_id, title, completion_mode, suggested_practice_days, position)
      VALUES ($1, 'Song', 'practice_days', 2, 0) RETURNING id`,
      [sectionId],
    );
    [{ id: oneTimeItemId }] = await dataSource.query(
      `INSERT INTO student_assignment_items
      (section_id, title, completion_mode, position)
      VALUES ($1, 'Theory test', 'one_time', 1) RETURNING id`,
      [sectionId],
    );

    await dataSource.query(
      `INSERT INTO practice_sessions
      (student_id, recorded_by_user_id, assignment_item_id, duration_seconds,
       practiced_at, practice_local_date, time_zone_snapshot, note)
      VALUES
      ($1, $2, $3, 600, ($4::date + time '12:00') AT TIME ZONE 'America/Toronto', $4, 'UTC', 'first'),
      ($1, $2, $3, 300, ($4::date + time '13:00') AT TIME ZONE 'America/Toronto', $4, 'UTC', 'same day'),
      ($1, $2, NULL, 300, ($4::date + time '14:00') AT TIME ZONE 'America/Toronto', $4, 'UTC', 'free'),
      ($1, $2, $3, 600, ($5::date + time '12:00') AT TIME ZONE 'America/Toronto', $5, 'UTC', 'second day')`,
      [studentId, userId, practiceItemId, yesterday, today],
    );
  });

  afterEach(async () => {
    await dataSource.query(
      `DELETE FROM practice_sessions WHERE student_id = $1`,
      [studentId],
    );
    await dataSource.query(`DELETE FROM student_assignments WHERE id = $1`, [
      assignmentId,
    ]);
    await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
  });

  it('deduplicates item days and XP while retaining all minutes and free practice', async () => {
    const partial = await service.getAssignmentSummary(userId, assignmentId);

    expect(partial).toMatchObject({
      weeklyMinutes: 30,
      distinctPracticeDays: 2,
      currentStreak: 2,
      xp: 20,
      assignmentCompleted: false,
    });
    expect(partial.items).toEqual([
      expect.objectContaining({
        itemId: practiceItemId,
        mode: 'practice_days',
        target: 2,
        current: 2,
        completed: true,
      }),
      expect.objectContaining({
        itemId: oneTimeItemId,
        mode: 'one_time',
        target: 1,
        current: 0,
        completed: false,
      }),
    ]);

    await dataSource.query(
      `INSERT INTO assignment_item_completions
      (item_id, student_id, completed_by_user_id)
      VALUES ($1, $2, $3)`,
      [oneTimeItemId, studentId, userId],
    );
    const completed = await service.getAssignmentSummary(userId, assignmentId);
    expect(completed.assignmentCompleted).toBe(true);
    expect(completed.items[1]).toMatchObject({ current: 1, completed: true });
  });

  it('recomputes item progress after session deletion without revoking earned XP', async () => {
    await service.getAssignmentSummary(userId, assignmentId);
    await dataSource.query(
      `DELETE FROM practice_sessions
      WHERE assignment_item_id = $1 AND practice_local_date = $2`,
      [practiceItemId, today],
    );

    const summary = await service.getAssignmentSummary(userId, assignmentId);

    expect(summary.items[0]).toMatchObject({ current: 1, completed: false });
    expect(summary.weeklyMinutes).toBe(20);
    expect(summary.xp).toBe(20);
  });

  it('awards daily XP once under concurrent duplicate writes', async () => {
    await dataSource.query(
      `DELETE FROM daily_practice_xp_awards WHERE student_id = $1`,
      [studentId],
    );
    await Promise.all(
      Array.from({ length: 10 }, () =>
        dataSource.query(
          `INSERT INTO daily_practice_xp_awards
          (student_id, practice_local_date) VALUES ($1, $2)
          ON CONFLICT (student_id, practice_local_date) DO NOTHING`,
          [studentId, today],
        ),
      ),
    );
    const xpResult: unknown = await dataSource.query(
      `SELECT COUNT(*)::int AS count,
      SUM(xp_amount)::int AS xp FROM daily_practice_xp_awards
      WHERE student_id = $1 AND practice_local_date = $2`,
      [studentId, today],
    );
    const [{ count, xp }] = xpResult as Array<{ count: number; xp: number }>;
    expect({ count, xp }).toEqual({ count: 1, xp: 10 });
  });
});
