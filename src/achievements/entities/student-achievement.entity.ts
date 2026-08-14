import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';

export enum AchievementKey {
  FIRST_PRACTICE = 'first_practice',
  WEEKLY_60_MINUTES = 'weekly_60_minutes',
  THREE_DAY_STREAK = 'three_day_streak',
  SEVEN_DAY_STREAK = 'seven_day_streak',
  FIRST_ASSIGNMENT_COMPLETE = 'first_assignment_complete',
}

@Entity('student_achievements')
@Unique('UQ_student_achievement_key', ['studentId', 'achievementKey'])
@Index('IDX_student_achievements_student_unlocked', ['studentId', 'unlockedAt'])
export class StudentAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'FK_student_achievement_student',
  })
  student: Student;

  @Column({ type: 'enum', enum: AchievementKey })
  achievementKey: AchievementKey;

  @CreateDateColumn({ type: 'timestamptz' })
  unlockedAt: Date;
}
