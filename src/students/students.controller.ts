import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { StudentDto } from './dto/student.dto';
import { StudentResponseMapper } from './mappers/student-response.mapper';
import type { PaginatedStudentDto } from './dto/paginated-students.dto';
import { Paginate } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';
import { CurrentUser } from '../auth/decorators/authenticated-user.decorator';
import { AuthenticatedUser } from '../auth/models/authenticated-user';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('students')
@ApiBearerAuth('bearer')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  async create(
    @Body() createStudentDto: CreateStudentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StudentDto> {
    const student = await this.studentsService.create(
      createStudentDto,
      user.userId,
    );
    return StudentResponseMapper.toDto(student);
  }

  @Get()
  async findAll(
    @Paginate() query: PaginateQuery,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedStudentDto> {
    const paginated = await this.studentsService.findAll(query, user.userId);

    return StudentResponseMapper.toDtoListFromPaginated(paginated);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StudentDto> {
    return StudentResponseMapper.toDto(
      await this.studentsService.findOneOwnedBy(user.userId, id),
    );
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StudentDto> {
    return StudentResponseMapper.toDto(
      await this.studentsService.update(user.userId, id, updateStudentDto),
    );
  }

  @Delete(':id')
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.studentsService.deactivate(user.userId, id);
  }
}
