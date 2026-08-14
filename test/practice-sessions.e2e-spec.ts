import dataSource from '../src/database/data-source';
import { QueryRunner } from 'typeorm';

describe('PracticeSession database invariants', () => {
  let queryRunner: QueryRunner;
  let userId: string;
  let studentId: string;
  let otherStudentId: string;
  let itemId: string;

  beforeAll(async () => {
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    [{ id: userId }] = (await queryRunner.query(
      `INSERT INTO users
      (email, password, first_name, last_name, date_of_birth)
      VALUES ($1, 'hash', 'Session', 'Tester', '1990-01-01') RETURNING id`,
      [`session-${crypto.randomUUID()}@example.com`],
    )) as Array<{ id: string }>;
    [{ id: studentId }] = (await queryRunner.query(
      `INSERT INTO student
      (owner_user_id, first_name, last_name, date_of_birth, time_zone)
      VALUES ($1, 'Toronto', 'Student', '2010-01-01', 'America/Toronto') RETURNING id`,
      [userId],
    )) as Array<{ id: string }>;
    [{ id: otherStudentId }] = (await queryRunner.query(
      `INSERT INTO student
      (owner_user_id, first_name, last_name, date_of_birth, time_zone)
      VALUES ($1, 'UTC', 'Student', '2011-01-01', 'UTC') RETURNING id`,
      [userId],
    )) as Array<{ id: string }>;
    const [{ id: assignmentId }] = (await queryRunner.query(
      `INSERT INTO student_assignments
      (student_id, creator_user_id, title, start_date, end_date)
      VALUES ($1, $2, 'Practice week', '2025-12-29', '2026-01-04') RETURNING id`,
      [studentId, userId],
    )) as Array<{ id: string }>;
    const [{ id: sectionId }] = (await queryRunner.query(
      `INSERT INTO assignment_sections
      (assignment_id, title, position) VALUES ($1, 'Repertoire', 0) RETURNING id`,
      [assignmentId],
    )) as Array<{ id: string }>;
    [{ id: itemId }] = (await queryRunner.query(
      `INSERT INTO student_assignment_items
      (section_id, title, completion_mode, suggested_practice_days, position)
      VALUES ($1, 'Song', 'practice_days', 5, 0) RETURNING id`,
      [sectionId],
    )) as Array<{ id: string }>;
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });

  it('derives and retains the time-zone snapshot and local date', async () => {
    const [session] = (await queryRunner.query(
      `INSERT INTO practice_sessions
      (student_id, recorded_by_user_id, assignment_item_id, duration_seconds,
       practiced_at, practice_local_date, time_zone_snapshot)
      VALUES ($1, $2, $3, 900, '2026-01-01T02:00:00Z', '2000-01-01', 'UTC')
      RETURNING practice_local_date::text, time_zone_snapshot`,
      [studentId, userId, itemId],
    )) as Array<{
      practice_local_date: string;
      time_zone_snapshot: string;
    }>;
    expect(session).toEqual({
      practice_local_date: '2025-12-31',
      time_zone_snapshot: 'America/Toronto',
    });

    await queryRunner.query(
      `UPDATE student SET time_zone = 'UTC' WHERE id = $1`,
      [studentId],
    );
    const [historical] = (await queryRunner.query(
      `SELECT practice_local_date::text,
      time_zone_snapshot FROM practice_sessions WHERE student_id = $1`,
      [studentId],
    )) as Array<Record<string, string>>;
    expect(historical).toEqual(session);

    await queryRunner.query(
      `UPDATE practice_sessions SET practice_local_date = '2000-01-01' WHERE student_id = $1`,
      [studentId],
    );
    const [protectedDate] = (await queryRunner.query(
      `SELECT practice_local_date::text FROM practice_sessions WHERE student_id = $1`,
      [studentId],
    )) as Array<{ practice_local_date: string }>;
    expect(protectedDate.practice_local_date).toBe('2025-12-31');
  });

  it('allows multiple sessions for one item and local date', async () => {
    await queryRunner.query(
      `INSERT INTO practice_sessions
      (student_id, recorded_by_user_id, assignment_item_id, duration_seconds,
       practiced_at, practice_local_date, time_zone_snapshot)
      VALUES
      ($1, $2, $3, 600, '2026-01-01T02:00:00Z', '2000-01-01', 'UTC'),
      ($1, $2, $3, 300, '2026-01-01T03:00:00Z', '2000-01-01', 'UTC')`,
      [studentId, userId, itemId],
    );
    const [{ count }] = (await queryRunner.query(
      `SELECT count(DISTINCT practice_local_date)::int
      FROM practice_sessions WHERE assignment_item_id = $1`,
      [itemId],
    )) as Array<{ count: number }>;
    expect(count).toBe(1);
  });

  it('rejects an item belonging to another student', async () => {
    await expect(
      queryRunner.query(
        `INSERT INTO practice_sessions
      (student_id, recorded_by_user_id, assignment_item_id, duration_seconds,
       practiced_at, practice_local_date, time_zone_snapshot)
      VALUES ($1, $2, $3, 600, now(), CURRENT_DATE, 'UTC')`,
        [otherStudentId, userId, itemId],
      ),
    ).rejects.toThrow('same student');
  });
});
