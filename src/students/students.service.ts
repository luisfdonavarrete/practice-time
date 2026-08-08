import { Injectable } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';

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

  async findAll(query: PaginateQuery): Promise<Paginated<Student>> {
    return paginate(query, this.studentRepository, {
      sortableColumns: ['id'],
      nullSort: 'last',
      defaultSortBy: [['id', 'DESC']],
      searchableColumns: ['firstName'],
      // select: ['id', 'name', 'color', 'age', 'lastVetVisit'],
    });
  }
}
