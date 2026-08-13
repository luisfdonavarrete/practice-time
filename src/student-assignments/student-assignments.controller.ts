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
import { StudentAssignmentsService } from './student-assignments.service';
import { CreateStudentAssignmentDto } from './dto/create-student-assignment.dto';
import { UpdateStudentAssignmentDto } from './dto/update-student-assignment.dto';
import { StudentAssignmentResponseDto } from './dto/student-assignment-response.dto';
import { CurrentUser } from '../auth/decorators/authenticated-user.decorator';
import { AuthenticatedUser } from '../auth/models/authenticated-user';

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
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const assignments = await this.studentAssignmentsService.findAll(
      user.userId,
    );
    return assignments.map(
      (assignment) => new StudentAssignmentResponseDto(assignment),
    );
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

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.studentAssignmentsService.remove(user.userId, id);
  }
}
