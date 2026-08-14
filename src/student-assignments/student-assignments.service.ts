import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateStudentAssignmentDto } from './dto/create-student-assignment.dto';
import { UpdateStudentAssignmentDto } from './dto/update-student-assignment.dto';
import { StudentAssignment } from './entities/student-assignment.entity';
import { Student } from '../students/entities/student.entity';
import { AssignmentNotice } from './entities/assignment-notice.entity';
import { AssignmentSection } from './entities/assignment-section.entity';
import { StudentAssignmentItem } from './entities/student-assignment-item.entity';
import { AssignmentItemResource } from './entities/assignment-item-resource.entity';

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
    const assignment = await this.findOne(ownerUserId, id);
    Object.assign(assignment, updateStudentAssignmentDto);
    await this.studentAssignmentRepository.save(assignment);
    return this.findOne(ownerUserId, id);
  }

  async remove(ownerUserId: string, id: string): Promise<void> {
    const assignment = await this.findOne(ownerUserId, id);
    await this.studentAssignmentRepository.remove(assignment);
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
