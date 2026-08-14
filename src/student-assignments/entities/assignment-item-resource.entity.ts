import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { StudentAssignmentItem } from './student-assignment-item.entity';

export enum AssignmentResourceKind {
  UPLOAD = 'upload',
  EXTERNAL_LINK = 'external_link',
  YOUTUBE = 'youtube',
}

@Entity('assignment_item_resources')
@Unique('UQ_assignment_resource_position', ['itemId', 'position'])
@Check(
  'CHK_assignment_resource_source',
  `(kind = 'upload' AND asset_key IS NOT NULL AND url IS NULL) OR (kind IN ('external_link', 'youtube') AND url IS NOT NULL AND asset_key IS NULL)`,
)
@Check('CHK_assignment_resource_position', 'position >= 0')
@Index('IDX_assignment_resources_item', ['itemId'])
export class AssignmentItemResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => StudentAssignmentItem, (item) => item.resources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'item_id',
    foreignKeyConstraintName: 'FK_assignment_resource_item',
  })
  item: StudentAssignmentItem;

  @Column({ type: 'enum', enum: AssignmentResourceKind })
  kind: AssignmentResourceKind;

  @Column()
  displayName: string;

  @Column({ type: 'varchar', nullable: true })
  assetKey: string | null;

  @Column({ type: 'text', nullable: true })
  url: string | null;

  @Column({ type: 'smallint' })
  position: number;
}
