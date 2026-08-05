import { Injectable, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  create(createStudentDto: CreateStudentDto) {
    const student = this.studentRepository.create(createStudentDto);
    return this.studentRepository.save(student);
  }

  async findAll(): Promise<Student[]> {
    console.log(await this.studentRepository.find());
    return await this.studentRepository.find();
  }

  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return `This action returns a #${id} student`;
  }

  update(
    @Param('id', ParseUUIDPipe) id: string,
    updateStudentDto: UpdateStudentDto,
  ) {
    return `This action updates a #${id} student`;
  }

  remove(@Param('id', ParseUUIDPipe) id: string) {
    return `This action removes a #${id} student`;
  }
}
