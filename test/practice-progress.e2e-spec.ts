import dataSource from '../src/database/data-source';
import { PracticeProgressService } from '../src/practice-progress/practice-progress.service';
import { NotFoundException } from '@nestjs/common';
import { AssignmentItemCompletionsService } from '../src/achievements/assignment-item-completions.service';
import { AssignmentProgressEvents } from '../src/achievements/assignment-progress.events';

describe('Practice progress PostgreSQL queries', () => {
  let service: PracticeProgressService;
  let completionsService: AssignmentItemCompletionsService;
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
    completionsService = new AssignmentItemCompletionsService(
      dataSource,
      new AssignmentProgressEvents(),
    );
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

  it('hides progress from unrelated users and for inactive or cancelled records', async () => {
    await expect(
      service.getAssignmentSummary(crypto.randomUUID(), assignmentId),
    ).rejects.toBeInstanceOf(NotFoundException);

    await dataSource.query(
      `UPDATE student SET is_active = false WHERE id = $1`,
      [studentId],
    );
    await expect(
      service.getAssignmentSummary(userId, assignmentId),
    ).rejects.toBeInstanceOf(NotFoundException);

    await dataSource.query(
      `UPDATE student SET is_active = true WHERE id = $1`,
      [studentId],
    );
    await dataSource.query(
      `UPDATE student_assignments SET status = 'cancelled' WHERE id = $1`,
      [assignmentId],
    );
    await expect(
      service.getAssignmentSummary(userId, assignmentId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes one-time progress when a completed task is reopened', async () => {
    await dataSource.query(
      `INSERT INTO assignment_item_completions
       (item_id, student_id, completed_by_user_id)
       VALUES ($1, $2, $3)`,
      [oneTimeItemId, studentId, userId],
    );
    expect(
      (await service.getAssignmentSummary(userId, assignmentId)).items[1],
    ).toMatchObject({
      current: 1,
      completed: true,
    });

    await dataSource.query(
      `UPDATE assignment_item_completions SET reopened_at = CURRENT_TIMESTAMP
       WHERE item_id = $1 AND reopened_at IS NULL`,
      [oneTimeItemId],
    );
    expect(
      (await service.getAssignmentSummary(userId, assignmentId)).items[1],
    ).toMatchObject({
      current: 0,
      completed: false,
    });
  });

  it.each([
    [
      'midnight across a negative UTC offset',
      '2026-01-01T04:30:00.000Z',
      'America/Toronto',
      '2025-12-31',
    ],
    [
      'DST spring transition',
      '2026-03-08T07:30:00.000Z',
      'America/Toronto',
      '2026-03-08',
    ],
    [
      'positive UTC offset',
      '2025-12-31T23:30:00.000Z',
      'Pacific/Auckland',
      '2026-01-01',
    ],
  ])(
    'derives the local calendar date at %s',
    async (_case, instant, zone, expectedDate) => {
      await dataSource.query(
        `UPDATE student SET time_zone = $2 WHERE id = $1`,
        [studentId, zone],
      );
      const result: unknown = await dataSource.query(
        `INSERT INTO practice_sessions
       (student_id, recorded_by_user_id, duration_seconds, practiced_at,
        practice_local_date, time_zone_snapshot)
       VALUES ($1, $2, 60, $3, CURRENT_DATE, 'UTC')
       RETURNING practice_local_date::text AS "localDate", time_zone_snapshot AS "snapshot"`,
        [studentId, userId, instant],
      );
      expect(result).toEqual([{ localDate: expectedDate, snapshot: zone }]);
    },
  );

  it('preserves the original calendar snapshot after the student changes time zone', async () => {
    const result: unknown = await dataSource.query(
      `INSERT INTO practice_sessions
       (student_id, recorded_by_user_id, duration_seconds, practiced_at,
        practice_local_date, time_zone_snapshot)
       VALUES ($1, $2, 60, '2025-12-31T23:30:00Z', CURRENT_DATE, 'UTC')
       RETURNING id, practice_local_date::text AS "localDate", time_zone_snapshot AS snapshot`,
      [studentId, userId],
    );
    const [session] = result as Array<{
      id: string;
      localDate: string;
      snapshot: string;
    }>;
    await dataSource.query(
      `UPDATE student SET time_zone = 'Pacific/Auckland' WHERE id = $1`,
      [studentId],
    );
    const stored: unknown = await dataSource.query(
      `SELECT practice_local_date::text AS "localDate", time_zone_snapshot AS snapshot
       FROM practice_sessions WHERE id = $1`,
      [session.id],
    );
    expect(stored).toEqual([
      { localDate: session.localDate, snapshot: session.snapshot },
    ]);
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

  it('creates one active item completion under concurrent retries', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        completionsService.complete(userId, oneTimeItemId),
      ),
    );
    expect(new Set(results.map((completion) => completion.id)).size).toBe(1);

    const countResult: unknown = await dataSource.query(
      `SELECT COUNT(*)::int AS count FROM assignment_item_completions
       WHERE item_id = $1 AND reopened_at IS NULL`,
      [oneTimeItemId],
    );
    expect(countResult).toEqual([{ count: 1 }]);
  });
});
