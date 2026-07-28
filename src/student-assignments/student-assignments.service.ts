import { Injectable } from '@nestjs/common';
import { CreateStudentAssignmentDto } from './dto/create-student-assignment.dto';
import { UpdateStudentAssignmentDto } from './dto/update-student-assignment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentAssignment } from './entities/student-assignment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StudentAssignmentsService {
  constructor(
    @InjectRepository(StudentAssignment)
    private StudentAssignmentRepository: Repository<StudentAssignment>,
  ) {}
  async create(
    createStudentAssignmentDto: CreateStudentAssignmentDto,
  ): Promise<StudentAssignment> {
    const entity = new StudentAssignment();

    entity.title = createStudentAssignmentDto.title;
    entity.description = createStudentAssignmentDto.description;
    entity.description = createStudentAssignmentDto.description;
    entity.start_date = createStudentAssignmentDto.start_date.toDateString();
    entity.end_date = createStudentAssignmentDto.end_date.toDateString();

    return await this.StudentAssignmentRepository.save(entity);
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
