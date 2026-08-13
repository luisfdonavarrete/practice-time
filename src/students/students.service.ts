import { Injectable } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(
    createStudentDto: CreateStudentDto,
    ownerUserId: string,
  ): Promise<Student> {
    const student = this.studentRepository.create({
      ...createStudentDto,
      ownerUserId,
    });
    return this.studentRepository.save(student);
  }

  async findAll(
    query: PaginateQuery,
    ownerUserId: string,
  ): Promise<Paginated<Student>> {
    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .where('student.owner_user_id = :ownerUserId', { ownerUserId })
      .andWhere('student.is_active = true');

    return paginate(query, queryBuilder, {
      sortableColumns: ['id'],
      nullSort: 'last',
      defaultSortBy: [['id', 'DESC']],
      searchableColumns: ['firstName'],
      // select: ['id', 'name', 'color', 'age', 'lastVetVisit'],
    });
  }

  findOneOwnedBy(ownerUserId: string, id: string): Promise<Student> {
    return this.studentRepository.findOneOrFail({
      where: { id, ownerUserId, isActive: true },
    });
  }

  async update(
    ownerUserId: string,
    id: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    const student = await this.findOneOwnedBy(ownerUserId, id);
    Object.assign(student, updateStudentDto);
    return this.studentRepository.save(student);
  }

  async deactivate(ownerUserId: string, id: string): Promise<void> {
    const student = await this.findOneOwnedBy(ownerUserId, id);
    student.isActive = false;
    await this.studentRepository.save(student);
  }
}
