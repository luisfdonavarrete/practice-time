import { Injectable } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/api/dto/pagination-query.dto';
import { PaginatedResult } from '../common/api/interceptors/global-response.interceptor';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const student = this.studentRepository.create(createStudentDto);
    return await this.studentRepository.save(student);
  }

  async findAll(
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Student[]>> {
    const { page, limit } = pagination;
    const [students, total] = await this.studentRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC', id: 'ASC' },
    });

    return {
      data: students,
      meta: { page, pageSize: limit, total },
    };
  }
}
