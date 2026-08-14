import {
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { catchError, EMPTY, merge, mergeMap, Subscription } from 'rxjs';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PracticeSessionEvents } from '../practice-sessions/practice-session.events';
import { Student } from '../students/entities/student.entity';
import { AchievementEvents } from './achievement.events';
import {
  evaluateAchievementRules,
  ACHIEVEMENT_RULES,
} from './achievement.rules';
import { AssignmentProgressEvents } from './assignment-progress.events';
import { AchievementResponseDto } from './dto/achievement-response.dto';
import {
  AchievementKey,
  StudentAchievement,
} from './entities/student-achievement.entity';

interface FactRow {
  hasPractice: boolean;
  hasSixtyMinuteWeek: boolean;
  currentStreak: number;
  hasCompletedAssignment: boolean;
}

interface AchievementRow {
  id: string;
  student_id: string;
  achievement_key: AchievementKey;
  unlocked_at: Date;
}

async function queryRows<T>(
  manager: EntityManager,
  query: string,
  parameters: unknown[],
): Promise<T[]> {
  const result: unknown = await manager.query(query, parameters);
  return result as T[];
}

@Injectable()
export class AchievementsService implements OnModuleInit, OnModuleDestroy {
  private subscription?: Subscription;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StudentAchievement)
    private readonly achievementRepository: Repository<StudentAchievement>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly practiceEvents: PracticeSessionEvents,
    private readonly progressEvents: AssignmentProgressEvents,
    private readonly achievementEvents: AchievementEvents,
  ) {}

  onModuleInit(): void {
    this.subscription = merge(
      this.practiceEvents.events$,
      this.progressEvents.events$,
    )
      .pipe(
        mergeMap((event) =>
          this.evaluateStudent(event.studentId).catch(() => undefined),
        ),
        catchError(() => EMPTY),
      )
      .subscribe();
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  async listForOwner(
    ownerUserId: string,
    studentId: string,
  ): Promise<AchievementResponseDto[]> {
    const owned = await this.studentRepository.existsBy({
      id: studentId,
      ownerUserId,
      isActive: true,
    });
    if (!owned) throw new NotFoundException('Student not found');

    await this.evaluateStudent(studentId);
    const achievements = await this.achievementRepository.find({
      where: { studentId },
      order: { unlockedAt: 'ASC' },
    });
    return achievements.map((achievement) => this.toResponse(achievement));
  }

  async evaluateStudent(studentId: string): Promise<StudentAchievement[]> {
    const inserted = await this.dataSource.transaction(async (manager) => {
      const rows = await queryRows<FactRow>(manager, this.factQuery, [
        studentId,
      ]);
      if (!rows[0]) return [];
      const qualified = evaluateAchievementRules({
        ...rows[0],
        currentStreak: Number(rows[0].currentStreak),
      });
      if (qualified.length === 0) return [];
      return queryRows<AchievementRow>(
        manager,
        `INSERT INTO student_achievements (student_id, achievement_key)
         SELECT $1, unnest($2::student_achievements_achievement_key_enum[])
         ON CONFLICT (student_id, achievement_key) DO NOTHING
         RETURNING id, student_id, achievement_key, unlocked_at`,
        [studentId, qualified.map((rule) => rule.key)],
      );
    });

    const achievements = inserted.map((row) =>
      this.achievementRepository.create({
        id: row.id,
        studentId: row.student_id,
        achievementKey: row.achievement_key,
        unlockedAt: new Date(row.unlocked_at),
      }),
    );
    for (const achievement of achievements) {
      const definition = ACHIEVEMENT_RULES.find(
        (rule) => rule.key === achievement.achievementKey,
      );
      if (!definition) continue;
      this.achievementEvents.publish({
        type: 'achievement.unlocked',
        achievementId: achievement.id,
        studentId: achievement.studentId,
        achievementKey: achievement.achievementKey,
        title: definition.title,
        description: definition.description,
        unlockedAt: achievement.unlockedAt.toISOString(),
      });
    }
    return achievements;
  }

  private toResponse(achievement: StudentAchievement): AchievementResponseDto {
    const definition = ACHIEVEMENT_RULES.find(
      (rule) => rule.key === achievement.achievementKey,
    );
    return {
      id: achievement.id,
      key: achievement.achievementKey,
      title: definition?.title ?? achievement.achievementKey,
      description: definition?.description ?? '',
      unlockedAt: achievement.unlockedAt.toISOString(),
    };
  }

  private readonly factQuery = `
    WITH owned_student AS (
      SELECT id, time_zone FROM student WHERE id = $1
    ), practice_dates AS (
      SELECT DISTINCT practice_local_date AS practice_date
      FROM practice_sessions WHERE student_id = $1
    ), numbered_dates AS (
      SELECT practice_date,
             practice_date - (ROW_NUMBER() OVER (ORDER BY practice_date))::int AS island
      FROM practice_dates
    ), streaks AS (
      SELECT MAX(practice_date) AS last_date, COUNT(*)::int AS length
      FROM numbered_dates GROUP BY island
    )
    SELECT
      EXISTS (SELECT 1 FROM practice_sessions WHERE student_id = $1) AS "hasPractice",
      EXISTS (
        SELECT 1 FROM student_assignments assignment
        WHERE assignment.student_id = $1
          AND (SELECT COALESCE(SUM(session.duration_seconds), 0)
               FROM practice_sessions session
               WHERE session.student_id = $1
                 AND session.practice_local_date BETWEEN assignment.start_date AND assignment.end_date) >= 3600
      ) AS "hasSixtyMinuteWeek",
      COALESCE((
        SELECT length FROM streaks, owned_student
        WHERE last_date IN (
          (CURRENT_TIMESTAMP AT TIME ZONE owned_student.time_zone)::date,
          (CURRENT_TIMESTAMP AT TIME ZONE owned_student.time_zone)::date - 1
        ) ORDER BY last_date DESC LIMIT 1
      ), 0)::int AS "currentStreak",
      EXISTS (
        SELECT 1 FROM student_assignments assignment
        WHERE assignment.student_id = $1
          AND assignment.status <> 'cancelled'
          AND EXISTS (
            SELECT 1 FROM assignment_sections section
            JOIN student_assignment_items item ON item.section_id = section.id
            WHERE section.assignment_id = assignment.id
          )
          AND NOT EXISTS (
            SELECT 1 FROM assignment_sections section
            JOIN student_assignment_items item ON item.section_id = section.id
            WHERE section.assignment_id = assignment.id AND (
              (item.completion_mode = 'one_time' AND NOT EXISTS (
                SELECT 1 FROM assignment_item_completions completion
                WHERE completion.item_id = item.id AND completion.reopened_at IS NULL
              )) OR
              (item.completion_mode = 'practice_days' AND (
                SELECT COUNT(DISTINCT session.practice_local_date)
                FROM practice_sessions session
                WHERE session.student_id = $1
                  AND session.assignment_item_id = item.id
                  AND session.practice_local_date BETWEEN assignment.start_date AND assignment.end_date
              ) < item.suggested_practice_days)
            )
          )
      ) AS "hasCompletedAssignment"
    FROM owned_student`;
}
