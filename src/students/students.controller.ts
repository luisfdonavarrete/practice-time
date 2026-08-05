import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { PaginationQueryDto } from '../common/api/dto/pagination-query.dto';
import { PaginatedResult } from '../common/api/interceptors/global-response.interceptor';
import { StudentResponseDto } from './dto/student-response.dto';
import { StudentResponseMapper } from './mappers/student-response.mapper';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  async create(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<StudentResponseDto> {
    const student = await this.studentsService.create(createStudentDto);
    return StudentResponseMapper.toDto(student);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<StudentResponseDto[]>> {
    const result = await this.studentsService.findAll(query);

    return {
      data: StudentResponseMapper.toDtoList(result.data),
      meta: result.meta,
    };
  }
}
