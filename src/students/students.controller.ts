import { Controller, Get, Post, Body } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { StudentDto } from './dto/student.dto';
import { StudentResponseMapper } from './mappers/student-response.mapper';
import { Paginate, Paginated } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  async create(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<StudentDto> {
    const student = await this.studentsService.create(createStudentDto);
    return StudentResponseMapper.toDto(student);
  }

  @Get()
  async findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<StudentDto>> {
    const paginated = await this.studentsService.findAll(query);

    return StudentResponseMapper.toDtoListFromPaginated(paginated);
  }
}
