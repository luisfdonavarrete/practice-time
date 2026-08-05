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

@UseInterceptors(ClassSerializerInterceptor)
@Controller('student-assignments')
export class StudentAssignmentsController {
  constructor(
    private readonly studentAssignmentsService: StudentAssignmentsService,
  ) {}

  @Post()
  async create(@Body() createStudentAssignmentDto: CreateStudentAssignmentDto) {
    const studentAssignment = await this.studentAssignmentsService.create(
      createStudentAssignmentDto,
    );

    return new StudentAssignmentResponseDto(studentAssignment);
  }

  @Get()
  findAll() {
    return this.studentAssignmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentAssignmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStudentAssignmentDto: UpdateStudentAssignmentDto,
  ) {
    return this.studentAssignmentsService.update(
      id,
      updateStudentAssignmentDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentAssignmentsService.remove(id);
  }
}
