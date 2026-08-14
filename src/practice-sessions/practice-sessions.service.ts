import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { StudentAssignmentStatus } from '../student-assignments/entities/student-assignment.entity';
import { StudentAssignmentItem } from '../student-assignments/entities/student-assignment-item.entity';
import { CreatePracticeSessionDto } from './dto/create-practice-session.dto';
import { ListPracticeSessionsQueryDto } from './dto/list-practice-sessions-query.dto';
import { UpdatePracticeSessionDto } from './dto/update-practice-session.dto';
import { PracticeSession } from './entities/practice-session.entity';
import {
  PracticeSessionEventType,
  PracticeSessionEvents,
} from './practice-session.events';

export interface PaginatedPracticeSessions {
  data: PracticeSession[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
  links: { current: string };
}

@Injectable()
export class PracticeSessionsService {
  constructor(
    @InjectRepository(PracticeSession)
    private readonly sessionRepository: Repository<PracticeSession>,
    private readonly dataSource: DataSource,
    private readonly events: PracticeSessionEvents,
  ) {}

  async create(
    ownerUserId: string,
    dto: CreatePracticeSessionDto,
  ): Promise<PracticeSession> {
    this.assertNotFuture(dto.practicedAt);
    const session = await this.dataSource.transaction(async (manager) => {
      await this.requireOwnedStudent(manager, ownerUserId, dto.studentId);
      if (dto.assignmentItemId) {
        await this.validateItem(
          manager,
          ownerUserId,
          dto.studentId,
          dto.assignmentItemId,
        );
      }
      const repository = manager.getRepository(PracticeSession);
      const created = repository.create({
        studentId: dto.studentId,
        recordedByUserId: ownerUserId,
        assignmentItemId: dto.assignmentItemId ?? null,
        durationSeconds: dto.durationSeconds,
        practicedAt: dto.practicedAt,
        note: dto.note?.trim() || null,
      });
      const saved = await repository.save(created);
      return repository.findOneOrFail({ where: { id: saved.id } });
    });
    this.publish('practice-session.created', session);
    return session;
  }

  async findAll(
    ownerUserId: string,
    query: ListPracticeSessionsQueryDto,
  ): Promise<PaginatedPracticeSessions> {
    if (
      query.practicedFrom &&
      query.practicedTo &&
      query.practicedFrom > query.practicedTo
    ) {
      throw new BadRequestException(
        'practicedFrom must be before or equal to practicedTo',
      );
    }
    const builder = this.sessionRepository
      .createQueryBuilder('session')
      .innerJoin('session.student', 'student')
      .where('student.owner_user_id = :ownerUserId', { ownerUserId });
    if (query.studentId) {
      builder.andWhere('session.student_id = :studentId', {
        studentId: query.studentId,
      });
    }
    if (query.assignmentItemId) {
      builder.andWhere('session.assignment_item_id = :assignmentItemId', {
        assignmentItemId: query.assignmentItemId,
      });
    }
    if (query.practiceLocalDate) {
      builder.andWhere('session.practice_local_date = :practiceLocalDate', {
        practiceLocalDate: query.practiceLocalDate,
      });
    }
    if (query.practicedFrom) {
      builder.andWhere('session.practiced_at >= :practicedFrom', {
        practicedFrom: query.practicedFrom,
      });
    }
    if (query.practicedTo) {
      builder.andWhere('session.practiced_at <= :practicedTo', {
        practicedTo: query.practicedTo,
      });
    }
    const [data, totalItems] = await builder
      .orderBy('session.practiced_at', 'DESC')
      .addOrderBy('session.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    const search = new URLSearchParams({
      page: String(query.page),
      limit: String(query.limit),
    });
    if (query.studentId) search.set('studentId', query.studentId);
    if (query.assignmentItemId) {
      search.set('assignmentItemId', query.assignmentItemId);
    }
    if (query.practiceLocalDate) {
      search.set('practiceLocalDate', query.practiceLocalDate);
    }
    if (query.practicedFrom) {
      search.set('practicedFrom', query.practicedFrom.toISOString());
    }
    if (query.practicedTo) {
      search.set('practicedTo', query.practicedTo.toISOString());
    }
    return {
      data,
      meta: {
        itemsPerPage: query.limit,
        totalItems,
        currentPage: query.page,
        totalPages: Math.ceil(totalItems / query.limit),
      },
      links: { current: `/practice-sessions?${search.toString()}` },
    };
  }

  async findOne(
    ownerUserId: string,
    sessionId: string,
  ): Promise<PracticeSession> {
    const session = await this.ownedSessionQuery(
      this.sessionRepository,
      ownerUserId,
    )
      .andWhere('session.id = :sessionId', { sessionId })
      .getOne();
    if (!session) throw new NotFoundException('Practice session not found');
    return session;
  }

  async update(
    ownerUserId: string,
    sessionId: string,
    dto: UpdatePracticeSessionDto,
  ): Promise<PracticeSession> {
    if (dto.practicedAt) this.assertNotFuture(dto.practicedAt);
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException('At least one correction is required');
    }
    const session = await this.dataSource.transaction(async (manager) => {
      const current = await this.requireOwnedSession(
        manager,
        ownerUserId,
        sessionId,
      );
      if (dto.assignmentItemId) {
        await this.validateItem(
          manager,
          ownerUserId,
          current.studentId,
          dto.assignmentItemId,
        );
      }
      if (dto.durationSeconds !== undefined) {
        current.durationSeconds = dto.durationSeconds;
      }
      if (dto.practicedAt !== undefined) {
        current.practicedAt = dto.practicedAt;
      }
      if (dto.assignmentItemId !== undefined) {
        current.assignmentItemId = dto.assignmentItemId;
      }
      if (dto.note !== undefined) {
        current.note = dto.note?.trim() || null;
      }
      const repository = manager.getRepository(PracticeSession);
      await repository.save(current);
      return repository.findOneOrFail({ where: { id: sessionId } });
    });
    this.publish('practice-session.corrected', session);
    return session;
  }

  async remove(ownerUserId: string, sessionId: string): Promise<void> {
    const deleted = await this.dataSource.transaction(async (manager) => {
      const session = await this.requireOwnedSession(
        manager,
        ownerUserId,
        sessionId,
      );
      const eventSnapshot = { ...session };
      await manager.getRepository(PracticeSession).remove(session);
      return eventSnapshot;
    });
    this.publish('practice-session.deleted', deleted);
  }

  private async requireOwnedStudent(
    manager: EntityManager,
    ownerUserId: string,
    studentId: string,
  ): Promise<void> {
    const student = await manager.getRepository(Student).findOne({
      where: { id: studentId, ownerUserId, isActive: true },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('Student not found');
  }

  private async validateItem(
    manager: EntityManager,
    ownerUserId: string,
    studentId: string,
    itemId: string,
  ): Promise<void> {
    const item = await manager
      .getRepository(StudentAssignmentItem)
      .createQueryBuilder('item')
      .innerJoin('item.section', 'section')
      .innerJoin('section.assignment', 'assignment')
      .innerJoin('assignment.student', 'student')
      .select('assignment.student_id', 'studentId')
      .addSelect('assignment.status', 'status')
      .where('item.id = :itemId', { itemId })
      .andWhere('student.owner_user_id = :ownerUserId', { ownerUserId })
      .getRawOne<{ studentId: string; status: StudentAssignmentStatus }>();
    if (!item) throw new NotFoundException('Assignment item not found');
    if (item.studentId !== studentId) {
      throw new BadRequestException(
        'Assignment item must belong to the session student',
      );
    }
    if (item.status === StudentAssignmentStatus.CANCELLED) {
      throw new BadRequestException(
        'Cancelled assignments cannot receive practice sessions',
      );
    }
  }

  private async requireOwnedSession(
    manager: EntityManager,
    ownerUserId: string,
    sessionId: string,
  ): Promise<PracticeSession> {
    const session = await this.ownedSessionQuery(
      manager.getRepository(PracticeSession),
      ownerUserId,
    )
      .andWhere('session.id = :sessionId', { sessionId })
      .setLock('pessimistic_write')
      .getOne();
    if (!session) throw new NotFoundException('Practice session not found');
    return session;
  }

  private ownedSessionQuery(
    repository: Repository<PracticeSession>,
    ownerUserId: string,
  ) {
    return repository
      .createQueryBuilder('session')
      .innerJoin('session.student', 'student')
      .where('student.owner_user_id = :ownerUserId', { ownerUserId });
  }

  private assertNotFuture(practicedAt: Date): void {
    if (practicedAt.getTime() > Date.now()) {
      throw new BadRequestException('practicedAt cannot be in the future');
    }
  }

  private publish(type: PracticeSessionEventType, session: PracticeSession) {
    this.events.publish({
      type,
      sessionId: session.id,
      studentId: session.studentId,
      assignmentItemId: session.assignmentItemId,
      practiceLocalDate: session.practiceLocalDate,
      occurredAt: new Date().toISOString(),
    });
  }
}
