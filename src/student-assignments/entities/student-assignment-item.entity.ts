import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AssignmentSection } from './assignment-section.entity';
import { AssignmentItemResource } from './assignment-item-resource.entity';
import { AssignmentItemCompletion } from './assignment-item-completion.entity';

export enum AssignmentCompletionMode {
  PRACTICE_DAYS = 'practice_days',
  ONE_TIME = 'one_time',
}

@Entity('student_assignment_items')
@Unique('UQ_assignment_item_position', ['sectionId', 'position'])
@Check(
  'CHK_assignment_item_mode_target',
  `(completion_mode = 'practice_days' AND suggested_practice_days BETWEEN 1 AND 7) OR (completion_mode = 'one_time' AND suggested_practice_days IS NULL)`,
)
@Check('CHK_assignment_item_position', 'position >= 0')
@Index('IDX_assignment_items_section', ['sectionId'])
export class StudentAssignmentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sectionId: string;

  @ManyToOne(() => AssignmentSection, (section) => section.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'section_id',
    foreignKeyConstraintName: 'FK_assignment_item_section',
  })
  section: AssignmentSection;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @Column({ type: 'enum', enum: AssignmentCompletionMode })
  completionMode: AssignmentCompletionMode;

  @Column({ type: 'smallint', nullable: true })
  suggestedPracticeDays: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  dueAt: Date | null;

  @Column({ type: 'smallint' })
  position: number;

  @OneToMany(() => AssignmentItemResource, (resource) => resource.item, {
    cascade: true,
  })
  resources: AssignmentItemResource[];

  @OneToMany(() => AssignmentItemCompletion, (completion) => completion.item)
  completions: AssignmentItemCompletion[];
}
