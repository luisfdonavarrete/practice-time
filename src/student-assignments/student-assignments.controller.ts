import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Paginate } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';
import { StudentAssignmentsService } from './student-assignments.service';
import { CreateStudentAssignmentDto } from './dto/create-student-assignment.dto';
import { UpdateStudentAssignmentDto } from './dto/update-student-assignment.dto';
import { StudentAssignmentResponseDto } from './dto/student-assignment-response.dto';
import { CurrentUser } from '../auth/decorators/authenticated-user.decorator';
import { AuthenticatedUser } from '../auth/models/authenticated-user';
import { DuplicateStudentAssignmentDto } from './dto/duplicate-student-assignment.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('weekly assignments')
@ApiBearerAuth('bearer')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('student-assignments')
export class StudentAssignmentsController {
  constructor(
    private readonly studentAssignmentsService: StudentAssignmentsService,
  ) {}

  @Post()
  async create(
    @Body() createStudentAssignmentDto: CreateStudentAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const studentAssignment = await this.studentAssignmentsService.create(
      createStudentAssignmentDto,
      user.userId,
    );

    return new StudentAssignmentResponseDto(studentAssignment);
  }

  @Get()
  async findAll(
    @Paginate() query: PaginateQuery,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const assignments = await this.studentAssignmentsService.findAll(
      query,
      user.userId,
    );
    return {
      ...assignments,
      data: assignments.data.map(
        (assignment) => new StudentAssignmentResponseDto(assignment),
      ),
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return new StudentAssignmentResponseDto(
      await this.studentAssignmentsService.findOne(user.userId, id),
    );
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStudentAssignmentDto: UpdateStudentAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return new StudentAssignmentResponseDto(
      await this.studentAssignmentsService.update(
        id,
        user.userId,
        updateStudentAssignmentDto,
      ),
    );
  }

  @Post(':id/publish')
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return new StudentAssignmentResponseDto(
      await this.studentAssignmentsService.publish(user.userId, id),
    );
  }

  @Post(':id/duplicate')
  async duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuplicateStudentAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return new StudentAssignmentResponseDto(
      await this.studentAssignmentsService.duplicate(
        user.userId,
        id,
        dto.startDate,
      ),
    );
  }

  @Post(':id/archive')
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return new StudentAssignmentResponseDto(
      await this.studentAssignmentsService.archive(user.userId, id),
    );
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return new StudentAssignmentResponseDto(
      await this.studentAssignmentsService.cancel(user.userId, id),
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.studentAssignmentsService.remove(user.userId, id);
  }
}
