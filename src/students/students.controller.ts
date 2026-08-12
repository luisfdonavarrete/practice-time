import { Controller, Get, Post, Body } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { StudentDto } from './dto/student.dto';
import { StudentResponseMapper } from './mappers/student-response.mapper';
import type { PaginatedStudentDto } from './dto/paginated-students.dto';
import { Paginate } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';
import { CurrentUser } from '../auth/decorators/authenticated-user.decorator';
import { AuthenticatedUser } from '../auth/models/authenticated-user';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  async create(
    @Body() createStudentDto: CreateStudentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StudentDto> {
    const student = await this.studentsService.create(createStudentDto, user);
    return StudentResponseMapper.toDto(student);
  }

  @Get()
  async findAll(
    @Paginate() query: PaginateQuery,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedStudentDto> {
    const paginated = await this.studentsService.findAll(query, user);

    return StudentResponseMapper.toDtoListFromPaginated(paginated);
  }
}
