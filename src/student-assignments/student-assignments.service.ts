import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateStudentAssignmentDto } from './dto/create-student-assignment.dto';
import { UpdateStudentAssignmentDto } from './dto/update-student-assignment.dto';
import {
  StudentAssignment,
  StudentAssignmentStatus,
} from './entities/student-assignment.entity';
import { Student } from '../students/entities/student.entity';
import { AssignmentNotice } from './entities/assignment-notice.entity';
import { AssignmentSection } from './entities/assignment-section.entity';
import { StudentAssignmentItem } from './entities/student-assignment-item.entity';
import {
  AssignmentItemResource,
  AssignmentResourceKind,
} from './entities/assignment-item-resource.entity';

@Injectable()
export class StudentAssignmentsService {
  constructor(
    @InjectRepository(StudentAssignment)
    private readonly studentAssignmentRepository: Repository<StudentAssignment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createStudentAssignmentDto: CreateStudentAssignmentDto,
    ownerUserId: string,
  ): Promise<StudentAssignment> {
    return this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Student).findOneOrFail({
        where: {
          id: createStudentAssignmentDto.studentId,
          ownerUserId,
          isActive: true,
        },
      });

      const assignmentRepository = manager.getRepository(StudentAssignment);
      const assignment = assignmentRepository.create({
        studentId: createStudentAssignmentDto.studentId,
        creatorUserId: ownerUserId,
        title: createStudentAssignmentDto.title,
        description: createStudentAssignmentDto.description,
        startDate: createStudentAssignmentDto.startDate,
        endDate: createStudentAssignmentDto.endDate,
        publishedAt: null,
        archivedAt: null,
        notices: createStudentAssignmentDto.notices.map((notice) =>
          manager.getRepository(AssignmentNotice).create({
            ...notice,
            occursAt: notice.occursAt ?? null,
            location: notice.location ?? null,
            details: notice.details ?? null,
          }),
        ),
        sections: createStudentAssignmentDto.sections.map((section) =>
          manager.getRepository(AssignmentSection).create({
            title: section.title,
            position: section.position,
            items: section.items.map((item) =>
              manager.getRepository(StudentAssignmentItem).create({
                title: item.title,
                instructions: item.instructions ?? null,
                completionMode: item.completionMode,
                suggestedPracticeDays: item.suggestedPracticeDays ?? null,
                dueAt: item.dueAt ?? null,
                position: item.position,
                resources: item.resources.map((resource) =>
                  manager.getRepository(AssignmentItemResource).create({
                    kind: resource.kind,
                    displayName: resource.displayName,
                    assetKey: null,
                    originalFilename: null,
                    mimeType: null,
                    byteSize: null,
                    sha256: null,
                    isActive: true,
                    url: resource.url ?? null,
                    position: resource.position,
                  }),
                ),
              }),
            ),
          }),
        ),
      });
      const saved = await assignmentRepository.save(assignment);
      return this.getOwnedAssignmentQuery(ownerUserId, assignmentRepository)
        .andWhere('assignment.id = :id', { id: saved.id })
        .getOneOrFail();
    });
  }

  findAll(ownerUserId: string): Promise<StudentAssignment[]> {
    return this.getOwnedAssignmentQuery(ownerUserId)
      .orderBy('assignment.created_at', 'DESC')
      .addOrderBy('notice.position', 'ASC')
      .addOrderBy('section.position', 'ASC')
      .addOrderBy('item.position', 'ASC')
      .addOrderBy('resource.position', 'ASC')
      .getMany();
  }

  async findOne(ownerUserId: string, id: string): Promise<StudentAssignment> {
    const assignment = await this.getOwnedAssignmentQuery(ownerUserId)
      .andWhere('assignment.id = :id', { id })
      .orderBy('notice.position', 'ASC')
      .addOrderBy('section.position', 'ASC')
      .addOrderBy('item.position', 'ASC')
      .addOrderBy('resource.position', 'ASC')
      .getOne();
    if (!assignment) {
      throw new NotFoundException(
        `StudentAssignment with ID "${id}" not found`,
      );
    }
    return assignment;
  }

  async update(
    id: string,
    ownerUserId: string,
    updateStudentAssignmentDto: UpdateStudentAssignmentDto,
  ): Promise<StudentAssignment> {
    return this.dataSource.transaction(async (manager) => {
      const assignmentRepository = manager.getRepository(StudentAssignment);
      const assignment = await this.getOwnedAssignmentQuery(
        ownerUserId,
        assignmentRepository,
      )
        .andWhere('assignment.id = :id', { id })
        .getOne();
      if (!assignment) {
        throw new NotFoundException(
          `StudentAssignment with ID "${id}" not found`,
        );
      }
      if (assignment.status !== StudentAssignmentStatus.DRAFT) {
        throw new BadRequestException('Only draft assignments can be edited');
      }

      const { notices, sections, ...details } = updateStudentAssignmentDto;
      if (Object.values(details).some((value) => value !== undefined)) {
        await assignmentRepository.update(id, details);
      }

      if (notices) {
        const noticeRepository = manager.getRepository(AssignmentNotice);
        await noticeRepository.delete({ assignmentId: id });
        await noticeRepository.save(
          notices.map((notice) =>
            noticeRepository.create({
              assignmentId: id,
              ...notice,
              occursAt: notice.occursAt ?? null,
              location: notice.location ?? null,
              details: notice.details ?? null,
            }),
          ),
        );
      }

      if (sections) {
        const retainedUploads = sections.flatMap((section) =>
          section.items.flatMap((item) => item.retainedUploads),
        );
        const retainedIds = retainedUploads.map((upload) => upload.id);
        if (new Set(retainedIds).size !== retainedIds.length) {
          throw new BadRequestException(
            'An uploaded resource can only appear once in an assignment',
          );
        }
        for (const section of sections) {
          for (const item of section.items) {
            const positions = [
              ...item.resources.map((resource) => resource.position),
              ...item.retainedUploads.map((upload) => upload.position),
            ];
            if (new Set(positions).size !== positions.length) {
              throw new BadRequestException(
                'Resource positions must be unique within an assignment item',
              );
            }
          }
        }

        const resourceRepository = manager.getRepository(
          AssignmentItemResource,
        );
        const ownedUploads = retainedIds.length
          ? await resourceRepository
              .createQueryBuilder('resource')
              .innerJoin('resource.item', 'item')
              .innerJoin('item.section', 'section')
              .where('resource.id IN (:...retainedIds)', { retainedIds })
              .andWhere('section.assignment_id = :assignmentId', {
                assignmentId: id,
              })
              .andWhere('resource.kind = :kind', {
                kind: AssignmentResourceKind.UPLOAD,
              })
              .andWhere('resource.is_active = true')
              .getMany()
          : [];
        if (ownedUploads.length !== retainedIds.length) {
          throw new BadRequestException(
            'One or more retained uploads do not belong to this assignment',
          );
        }

        const sectionRepository = manager.getRepository(AssignmentSection);
        const oldSectionIds = assignment.sections.map((section) => section.id);
        if (oldSectionIds.length) {
          await sectionRepository
            .createQueryBuilder()
            .update()
            .set({ position: () => 'position + 1000' })
            .where({ id: In(oldSectionIds) })
            .execute();
        }

        const nextSections = sections.map((section) =>
          sectionRepository.create({
            assignmentId: id,
            title: section.title,
            position: section.position,
            items: section.items.map((item) =>
              manager.getRepository(StudentAssignmentItem).create({
                title: item.title,
                instructions: item.instructions ?? null,
                completionMode: item.completionMode,
                suggestedPracticeDays: item.suggestedPracticeDays ?? null,
                dueAt: item.dueAt ?? null,
                position: item.position,
                resources: item.resources.map((resource) =>
                  resourceRepository.create({
                    kind: resource.kind,
                    displayName: resource.displayName,
                    assetKey: null,
                    originalFilename: null,
                    mimeType: null,
                    byteSize: null,
                    sha256: null,
                    isActive: true,
                    url: resource.url ?? null,
                    position: resource.position,
                  }),
                ),
              }),
            ),
          }),
        );
        const savedSections = await sectionRepository.save(nextSections);

        for (const [sectionIndex, section] of sections.entries()) {
          for (const [itemIndex, item] of section.items.entries()) {
            const savedItem = savedSections[sectionIndex]?.items[itemIndex];
            if (!savedItem) {
              throw new BadRequestException(
                'The updated assignment structure could not be saved',
              );
            }
            for (const upload of item.retainedUploads) {
              await resourceRepository.update(upload.id, {
                itemId: savedItem.id,
                displayName: upload.displayName,
                position: upload.position,
              });
            }
          }
        }

        if (oldSectionIds.length) {
          await sectionRepository.delete(oldSectionIds);
        }
      }

      return this.getOwnedAssignmentQuery(ownerUserId, assignmentRepository)
        .andWhere('assignment.id = :id', { id })
        .orderBy('notice.position', 'ASC')
        .addOrderBy('section.position', 'ASC')
        .addOrderBy('item.position', 'ASC')
        .addOrderBy('resource.position', 'ASC')
        .getOneOrFail();
    });
  }

  async remove(ownerUserId: string, id: string): Promise<void> {
    const assignment = await this.findOne(ownerUserId, id);
    await this.studentAssignmentRepository.remove(assignment);
  }

  async publish(ownerUserId: string, id: string): Promise<StudentAssignment> {
    const assignment = await this.findOne(ownerUserId, id);
    if (assignment.status !== StudentAssignmentStatus.DRAFT) {
      throw new BadRequestException('Only draft assignments can be published');
    }
    assignment.status = StudentAssignmentStatus.PUBLISHED;
    assignment.publishedAt = new Date();
    await this.studentAssignmentRepository.save(assignment);
    return this.findOne(ownerUserId, id);
  }

  private getOwnedAssignmentQuery(
    ownerUserId: string,
    repository = this.studentAssignmentRepository,
  ): SelectQueryBuilder<StudentAssignment> {
    return repository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.student', 'student')
      .leftJoinAndSelect('assignment.notices', 'notice')
      .leftJoinAndSelect('assignment.sections', 'section')
      .leftJoinAndSelect('section.items', 'item')
      .leftJoinAndSelect(
        'item.resources',
        'resource',
        'resource.is_active = true',
      )
      .where('student.owner_user_id = :ownerUserId', { ownerUserId });
  }
}
