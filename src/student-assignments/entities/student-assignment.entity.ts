import {
  Column,
  Check,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';
import { AssignmentNotice } from './assignment-notice.entity';
import { AssignmentSection } from './assignment-section.entity';

export enum StudentAssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled',
}

@Entity('student_assignments')
@Check('CHK_assignment_seven_day_range', 'end_date = start_date + 6')
@Index('IDX_assignments_student_id', ['studentId'])
@Index('IDX_assignments_student_dates_status', [
  'studentId',
  'startDate',
  'endDate',
  'status',
])
export class StudentAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'FK_assignment_student',
  })
  student: Student;

  @Column({ type: 'uuid' })
  creatorUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'creator_user_id',
    foreignKeyConstraintName: 'FK_assignment_creator',
  })
  creator: User;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({
    type: 'enum',
    enum: StudentAssignmentStatus,
    default: StudentAssignmentStatus.DRAFT,
  })
  status: StudentAssignmentStatus;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt: Date | null;

  @OneToMany(() => AssignmentNotice, (notice) => notice.assignment, {
    cascade: true,
  })
  notices: AssignmentNotice[];

  @OneToMany(() => AssignmentSection, (section) => section.assignment, {
    cascade: true,
  })
  sections: AssignmentSection[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
