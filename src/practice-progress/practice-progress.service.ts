import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PracticeSummaryDto } from './dto/practice-summary.dto';

interface OwnedAssignmentRow {
  assignmentId: string;
  studentId: string;
  startDate: string;
  endDate: string;
  timeZone: string;
}

@Injectable()
export class PracticeProgressService {
  constructor(private readonly dataSource: DataSource) {}

  async getAssignmentSummary(
    ownerUserId: string,
    assignmentId: string,
  ): Promise<PracticeSummaryDto> {
    return this.dataSource.transaction<PracticeSummaryDto>(async (manager) => {
      const assignmentResult: unknown = await manager.query(
        `SELECT assignment.id AS "assignmentId",
                assignment.student_id AS "studentId",
                assignment.start_date::text AS "startDate",
                assignment.end_date::text AS "endDate",
                student.time_zone AS "timeZone"
         FROM student_assignments assignment
         JOIN student ON student.id = assignment.student_id
         WHERE assignment.id = $1
           AND student.owner_user_id = $2
           AND student.is_active = true
           AND assignment.status <> 'cancelled'`,
        [assignmentId, ownerUserId],
      );
      const [assignment] = assignmentResult as OwnedAssignmentRow[];
      if (!assignment) {
        throw new NotFoundException('Student assignment not found');
      }

      await manager.query(
        `INSERT INTO daily_practice_xp_awards
           (student_id, practice_local_date)
         SELECT DISTINCT student_id, practice_local_date
         FROM practice_sessions
         WHERE student_id = $1
         ON CONFLICT (student_id, practice_local_date) DO NOTHING`,
        [assignment.studentId],
      );

      const summaryResult: unknown = await manager.query(
        `WITH item_stats AS (
           SELECT item.id AS item_id,
                  section.id AS section_id,
                  section.title AS section_title,
                  section.position AS section_position,
                  item.title,
                  item.position AS item_position,
                  item.completion_mode::text AS mode,
                  CASE WHEN item.completion_mode = 'practice_days'
                       THEN item.suggested_practice_days ELSE 1 END AS target,
                  COUNT(DISTINCT session.practice_local_date)::int AS practiced_days,
                  EXISTS (
                    SELECT 1 FROM assignment_item_completions completion
                    WHERE completion.item_id = item.id
                      AND completion.reopened_at IS NULL
                  ) AS one_time_completed
           FROM assignment_sections section
           JOIN student_assignment_items item ON item.section_id = section.id
           LEFT JOIN practice_sessions session
             ON session.assignment_item_id = item.id
            AND session.student_id = $2
            AND session.practice_local_date BETWEEN $3::date AND $4::date
           WHERE section.assignment_id = $1
           GROUP BY item.id, section.id
         ), item_progress AS (
           SELECT *,
                  CASE WHEN mode = 'practice_days'
                       THEN LEAST(practiced_days, target)
                       ELSE one_time_completed::int END AS current,
                  CASE WHEN mode = 'practice_days'
                       THEN practiced_days >= target
                       ELSE one_time_completed END AS completed
           FROM item_stats
         ), weekly AS (
           SELECT COALESCE(ROUND(SUM(duration_seconds) / 60.0, 2), 0)::float8 AS minutes,
                  COUNT(DISTINCT practice_local_date)::int AS practice_days
           FROM practice_sessions
           WHERE student_id = $2
             AND practice_local_date BETWEEN $3::date AND $4::date
         ), practice_dates AS (
           SELECT DISTINCT practice_local_date
           FROM practice_sessions
           WHERE student_id = $2
         ), numbered_dates AS (
           SELECT practice_local_date,
                  practice_local_date -
                    (ROW_NUMBER() OVER (ORDER BY practice_local_date))::int AS island_key
           FROM practice_dates
         ), streak_islands AS (
           SELECT MIN(practice_local_date) AS start_date,
                  MAX(practice_local_date) AS end_date,
                  COUNT(*)::int AS day_count
           FROM numbered_dates
           GROUP BY island_key
         ), current_streak AS (
           SELECT COALESCE((
             SELECT day_count FROM streak_islands
             WHERE end_date >=
               (CURRENT_TIMESTAMP AT TIME ZONE $5)::date - 1
             ORDER BY end_date DESC
             LIMIT 1
           ), 0)::int AS value
         ), xp_total AS (
           SELECT COALESCE(SUM(xp_amount), 0)::int AS value
           FROM daily_practice_xp_awards
           WHERE student_id = $2
         )
         SELECT $1::uuid AS "assignmentId",
                $2::uuid AS "studentId",
                $3::date::text AS "startDate",
                $4::date::text AS "endDate",
                weekly.minutes AS "weeklyMinutes",
                weekly.practice_days AS "distinctPracticeDays",
                current_streak.value AS "currentStreak",
                xp_total.value AS xp,
                COALESCE((SELECT BOOL_AND(completed) FROM item_progress), false)
                  AS "assignmentCompleted",
                COALESCE((
                  SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
                    'itemId', item_id,
                    'sectionId', section_id,
                    'sectionTitle', section_title,
                    'title', title,
                    'mode', mode,
                    'target', target,
                    'current', current,
                    'completed', completed,
                    'sectionPosition', section_position,
                    'itemPosition', item_position
                  ) ORDER BY section_position, item_position)
                  FROM item_progress
                ), '[]'::jsonb) AS items
         FROM weekly CROSS JOIN current_streak CROSS JOIN xp_total`,
        [
          assignment.assignmentId,
          assignment.studentId,
          assignment.startDate,
          assignment.endDate,
          assignment.timeZone,
        ],
      );
      const [summary] = summaryResult as PracticeSummaryDto[];
      return summary;
    });
  }
}
