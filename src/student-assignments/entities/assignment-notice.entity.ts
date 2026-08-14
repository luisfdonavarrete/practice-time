import {
  Column,
  Check,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { StudentAssignment } from './student-assignment.entity';

@Entity('assignment_notices')
@Unique('UQ_assignment_notice_position', ['assignmentId', 'position'])
@Check('CHK_assignment_notice_position', 'position >= 0')
@Index('IDX_assignment_notices_assignment', ['assignmentId'])
export class AssignmentNotice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assignmentId: string;

  @ManyToOne(() => StudentAssignment, (assignment) => assignment.notices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'assignment_id',
    foreignKeyConstraintName: 'FK_assignment_notice_assignment',
  })
  assignment: StudentAssignment;

  @Column()
  title: string;

  @Column({ type: 'timestamptz', nullable: true })
  occursAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @Column({ type: 'smallint' })
  position: number;
}
