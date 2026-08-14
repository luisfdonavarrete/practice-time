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
  `(kind = 'upload' AND asset_key IS NOT NULL AND url IS NULL AND (is_active = false OR (original_filename IS NOT NULL AND mime_type IS NOT NULL AND byte_size > 0 AND sha256 IS NOT NULL))) OR (kind IN ('external_link', 'youtube') AND url IS NOT NULL AND asset_key IS NULL AND original_filename IS NULL AND mime_type IS NULL AND byte_size IS NULL AND sha256 IS NULL)`,
)
@Check('CHK_assignment_resource_position', 'position >= 0')
@Index('IDX_assignment_resources_item', ['itemId'])
@Index('IDX_assignment_resources_asset_key', ['assetKey'], {
  where: '"asset_key" IS NOT NULL',
})
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

  @Column({ type: 'varchar', nullable: true })
  originalFilename: string | null;

  @Column({ type: 'varchar', nullable: true })
  mimeType: string | null;

  @Column({ type: 'integer', nullable: true })
  byteSize: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sha256: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  url: string | null;

  @Column({ type: 'smallint' })
  position: number;
}
