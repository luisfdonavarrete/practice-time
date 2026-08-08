import { Injectable } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interceptors/global-response.interceptor';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const { birthdate, first_name, last_name } = createStudentDto;
    const student = this.studentRepository.create({
      firstName: first_name,
      lastName: last_name,
      dateOfBirth: birthdate,
    });
    return await this.studentRepository.save(student);
  }

  async findAll(
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Student[]>> {
    const { page, limit } = pagination;
    const [students, total] = await this.studentRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC', id: 'ASC' },
    });

    return {
      data: students,
      meta: { page, pageSize: limit, total },
    };
  }
}
