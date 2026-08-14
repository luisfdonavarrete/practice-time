import {
  Column,
  Check,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { StudentAssignment } from './student-assignment.entity';
import { StudentAssignmentItem } from './student-assignment-item.entity';

@Entity('assignment_sections')
@Unique('UQ_assignment_section_position', ['assignmentId', 'position'])
@Check('CHK_assignment_section_position', 'position >= 0')
@Index('IDX_assignment_sections_assignment', ['assignmentId'])
export class AssignmentSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assignmentId: string;

  @ManyToOne(() => StudentAssignment, (assignment) => assignment.sections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'assignment_id',
    foreignKeyConstraintName: 'FK_assignment_section_assignment',
  })
  assignment: StudentAssignment;

  @Column()
  title: string;

  @Column({ type: 'smallint' })
  position: number;

  @OneToMany(() => StudentAssignmentItem, (item) => item.section, {
    cascade: true,
  })
  items: StudentAssignmentItem[];
}
