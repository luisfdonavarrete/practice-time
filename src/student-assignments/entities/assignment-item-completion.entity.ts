import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StudentAssignmentItem } from './student-assignment-item.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';

@Entity('assignment_item_completions')
@Index('UQ_active_item_completion', ['itemId'], {
  unique: true,
  where: '"reopened_at" IS NULL',
})
@Index('IDX_assignment_completions_student', ['studentId'])
export class AssignmentItemCompletion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => StudentAssignmentItem, (item) => item.completions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'item_id',
    foreignKeyConstraintName: 'FK_assignment_completion_item',
  })
  item: StudentAssignmentItem;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'FK_assignment_completion_student',
  })
  student: Student;

  @Column({ type: 'uuid' })
  completedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'completed_by_user_id',
    foreignKeyConstraintName: 'FK_assignment_completion_user',
  })
  completedBy: User;

  @CreateDateColumn({ type: 'timestamptz' })
  completedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  reopenedAt: Date | null;
}
