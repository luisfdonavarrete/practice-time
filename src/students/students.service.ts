import { Injectable } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { DataSource, Repository } from 'typeorm';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { AuthenticatedUser } from '../auth/models/authenticated-user';
import {
  StudentUser,
  StudentUserRelationship,
} from './entities/student-user.entity';
import { UpdateStudentDto } from './dto/update-student.dto';
import {
  STUDENT_RELATIONSHIP_PERMISSIONS,
  StudentAction,
} from './policies/student-access.permissions';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private dataSource: DataSource,
  ) {}

  async create(
    createStudentDto: CreateStudentDto,
    user: AuthenticatedUser,
  ): Promise<Student> {
    return await this.dataSource.transaction(async (manager) => {
      const studentRepository = manager.getRepository(Student);
      const student = studentRepository.create(createStudentDto);
      const studentEntity = await studentRepository.save(student);

      const studentUserRepository = manager.getRepository(StudentUser);
      const studentUser = studentUserRepository.create({
        studentId: studentEntity.id,
        userId: user.userId,
        relationship: StudentUserRelationship.PARENT,
      });

      await studentUserRepository.save(studentUser);
      return studentEntity;
    });
  }

  async findAll(
    query: PaginateQuery,
    user: AuthenticatedUser,
  ): Promise<Paginated<Student>> {
    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .innerJoin('student.userAccesses', 'studentUser')
      .where('studentUser.user_id = :userId', { userId: user.userId })
      .andWhere('studentUser.revoked_at IS NULL')
      .andWhere('student.is_active = true')
      .andWhere('studentUser.relationship IN (:...relationships)', {
        relationships: [
          ...STUDENT_RELATIONSHIP_PERMISSIONS[StudentAction.View],
        ],
      });

    return paginate(query, queryBuilder, {
      sortableColumns: ['id'],
      nullSort: 'last',
      defaultSortBy: [['id', 'DESC']],
      searchableColumns: ['firstName'],
      // select: ['id', 'name', 'color', 'age', 'lastVetVisit'],
    });
  }

  findOne(id: string): Promise<Student> {
    return this.studentRepository.findOneOrFail({ where: { id } });
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    const student = await this.findOne(id);
    Object.assign(student, updateStudentDto);
    return this.studentRepository.save(student);
  }
}
