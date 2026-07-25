import { Injectable } from '@nestjs/common';
import { CreateStudentAssignmentDto } from './dto/create-student-assignment.dto';
import { UpdateStudentAssignmentDto } from './dto/update-student-assignment.dto';

@Injectable()
export class StudentAssignmentsService {
  create(createStudentAssignmentDto: CreateStudentAssignmentDto) {
    return 'This action adds a new studentAssignment';
  }

  findAll() {
    return `This action returns all studentAssignments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} studentAssignment`;
  }

  update(id: number, updateStudentAssignmentDto: UpdateStudentAssignmentDto) {
    return `This action updates a #${id} studentAssignment`;
  }

  remove(id: number) {
    return `This action removes a #${id} studentAssignment`;
  }
}
