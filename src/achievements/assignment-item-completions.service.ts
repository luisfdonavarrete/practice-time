import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AssignmentCompletionMode } from '../student-assignments/entities/student-assignment-item.entity';
import { StudentAssignmentStatus } from '../student-assignments/entities/student-assignment.entity';
import { AssignmentProgressEvents } from './assignment-progress.events';
import { AssignmentItemCompletionResponseDto } from './dto/assignment-item-completion-response.dto';

interface ItemContext {
  itemId: string;
  studentId: string;
  assignmentId: string;
  completionMode: AssignmentCompletionMode;
  status: StudentAssignmentStatus;
}

interface CompletionRow {
  id: string;
  item_id: string;
  student_id: string;
  completed_at: Date;
}

async function queryRows<T>(
  manager: EntityManager,
  query: string,
  parameters: unknown[],
): Promise<T[]> {
  const result: unknown = await manager.query(query, parameters);
  return result as T[];
}

@Injectable()
export class AssignmentItemCompletionsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly progressEvents: AssignmentProgressEvents,
  ) {}

  async complete(
    ownerUserId: string,
    itemId: string,
  ): Promise<AssignmentItemCompletionResponseDto> {
    let created = false;
    let context!: ItemContext;
    const completion = await this.dataSource.transaction(async (manager) => {
      context = await this.getItemContext(manager, ownerUserId, itemId);
      this.assertCompletable(context);
      const inserted = await queryRows<CompletionRow>(
        manager,
        `INSERT INTO assignment_item_completions
           (item_id, student_id, completed_by_user_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (item_id) WHERE reopened_at IS NULL DO NOTHING
         RETURNING id, item_id, student_id, completed_at`,
        [itemId, context.studentId, ownerUserId],
      );
      created = inserted.length === 1;
      if (created) return inserted[0];
      const existing = await queryRows<CompletionRow>(
        manager,
        `SELECT id, item_id, student_id, completed_at
         FROM assignment_item_completions
         WHERE item_id = $1 AND reopened_at IS NULL`,
        [itemId],
      );
      return existing[0];
    });

    if (created) this.publishChange(context);
    return this.mapCompletion(completion);
  }

  async reopen(ownerUserId: string, itemId: string): Promise<void> {
    let context!: ItemContext;
    const changed = await this.dataSource.transaction(async (manager) => {
      context = await this.getItemContext(manager, ownerUserId, itemId);
      this.assertCompletable(context);
      const rows = await queryRows<{ id: string }>(
        manager,
        `UPDATE assignment_item_completions
         SET reopened_at = CURRENT_TIMESTAMP
         WHERE item_id = $1 AND reopened_at IS NULL
         RETURNING id`,
        [itemId],
      );
      return rows.length === 1;
    });
    if (changed) this.publishChange(context);
  }

  private async getItemContext(
    manager: EntityManager,
    ownerUserId: string,
    itemId: string,
  ): Promise<ItemContext> {
    const rows = await queryRows<ItemContext>(
      manager,
      `SELECT item.id AS "itemId", assignment.student_id AS "studentId",
              assignment.id AS "assignmentId",
              item.completion_mode AS "completionMode", assignment.status
       FROM student_assignment_items item
       JOIN assignment_sections section ON section.id = item.section_id
       JOIN student_assignments assignment ON assignment.id = section.assignment_id
       JOIN student student ON student.id = assignment.student_id
       WHERE item.id = $1 AND student.owner_user_id = $2 AND student.is_active = true`,
      [itemId, ownerUserId],
    );
    if (!rows[0]) throw new NotFoundException('Assignment item not found');
    return rows[0];
  }

  private assertCompletable(context: ItemContext): void {
    if (context.completionMode !== AssignmentCompletionMode.ONE_TIME) {
      throw new BadRequestException(
        'Only one-time items can be completed directly',
      );
    }
    if (context.status === StudentAssignmentStatus.CANCELLED) {
      throw new BadRequestException(
        'Cancelled assignment items cannot be completed',
      );
    }
  }

  private publishChange(context: ItemContext): void {
    this.progressEvents.publish({
      type: 'assignment-progress.changed',
      studentId: context.studentId,
      assignmentId: context.assignmentId,
      itemId: context.itemId,
      occurredAt: new Date().toISOString(),
    });
  }

  private mapCompletion(
    row: CompletionRow,
  ): AssignmentItemCompletionResponseDto {
    return {
      id: row.id,
      itemId: row.item_id,
      studentId: row.student_id,
      completedAt: new Date(row.completed_at).toISOString(),
    };
  }
}
