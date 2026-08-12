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
      .where('studentUser.user_id = :userId', { userId: user.userId });

    return paginate(query, queryBuilder, {
      sortableColumns: ['id'],
      nullSort: 'last',
      defaultSortBy: [['id', 'DESC']],
      searchableColumns: ['firstName'],
      // select: ['id', 'name', 'color', 'age', 'lastVetVisit'],
    });
  }
}
