import {
  Check,
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

@Entity('daily_practice_xp_awards')
@Unique('UQ_daily_practice_xp_student_date', ['studentId', 'practiceLocalDate'])
@Check('CHK_daily_practice_xp_amount', 'xp_amount > 0')
@Index('IDX_daily_practice_xp_student_date', ['studentId', 'practiceLocalDate'])
export class DailyPracticeXpAward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'FK_daily_practice_xp_student',
  })
  student: Student;

  @Column({ type: 'date' })
  practiceLocalDate: string;

  @Column({ type: 'smallint', default: 10 })
  xpAmount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
