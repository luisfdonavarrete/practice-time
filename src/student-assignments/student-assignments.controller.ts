import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StudentAssignmentsService } from './student-assignments.service';
import { CreateStudentAssignmentDto } from './dto/create-student-assignment.dto';
import { UpdateStudentAssignmentDto } from './dto/update-student-assignment.dto';

@Controller('student-assignments')
export class StudentAssignmentsController {
  constructor(private readonly studentAssignmentsService: StudentAssignmentsService) {}

  @Post()
  create(@Body() createStudentAssignmentDto: CreateStudentAssignmentDto) {
    return this.studentAssignmentsService.create(createStudentAssignmentDto);
  }

  @Get()
  findAll() {
    return this.studentAssignmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentAssignmentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentAssignmentDto: UpdateStudentAssignmentDto) {
    return this.studentAssignmentsService.update(+id, updateStudentAssignmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentAssignmentsService.remove(+id);
  }
}
