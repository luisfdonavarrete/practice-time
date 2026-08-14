import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';
import { StudentAssignmentItem } from '../../student-assignments/entities/student-assignment-item.entity';

@Entity('practice_sessions')
@Check('CHK_practice_session_positive_duration', 'duration_seconds > 0')
@Check(
  'CHK_practice_session_iana_time_zone',
  `time_zone_snapshot = 'UTC' OR time_zone_snapshot LIKE '%/%'`,
)
@Index('IDX_practice_sessions_student_local_date', [
  'studentId',
  'practiceLocalDate',
])
@Index('IDX_practice_sessions_student_practiced_at', [
  'studentId',
  'practicedAt',
])
@Index('IDX_practice_sessions_item_local_date', [
  'assignmentItemId',
  'practiceLocalDate',
])
export class PracticeSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'FK_practice_session_student',
  })
  student: Student;

  @Column({ type: 'uuid' })
  recordedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'recorded_by_user_id',
    foreignKeyConstraintName: 'FK_practice_session_recorder',
  })
  recordedBy: User;

  @Column({ type: 'uuid', nullable: true })
  assignmentItemId: string | null;

  @ManyToOne(() => StudentAssignmentItem, { onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'assignment_item_id',
    foreignKeyConstraintName: 'FK_practice_session_assignment_item',
  })
  assignmentItem: StudentAssignmentItem | null;

  @Column({ type: 'integer' })
  durationSeconds: number;

  @Column({ type: 'timestamptz' })
  practicedAt: Date;

  @Column({ type: 'date' })
  practiceLocalDate: string;

  @Column({ type: 'varchar', length: 255 })
  timeZoneSnapshot: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
