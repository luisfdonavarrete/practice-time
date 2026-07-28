import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStudentAssignmentDto } from './dto/create-student-assignment.dto';
import { UpdateStudentAssignmentDto } from './dto/update-student-assignment.dto';
import { StudentAssignment } from './entities/student-assignment.entity';

@Injectable()
export class StudentAssignmentsService {
  constructor(
    @InjectRepository(StudentAssignment)
    private readonly studentAssignmentRepository: Repository<StudentAssignment>,
  ) {}

  async create(
    createStudentAssignmentDto: CreateStudentAssignmentDto,
  ): Promise<StudentAssignment> {
    const assignment = this.studentAssignmentRepository.create(
      createStudentAssignmentDto,
    );
    return await this.studentAssignmentRepository.save(assignment);
  }

  async findAll(): Promise<StudentAssignment[]> {
    return await this.studentAssignmentRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<StudentAssignment> {
    const assignment = await this.studentAssignmentRepository.findOneBy({ id });
    if (!assignment) {
      throw new NotFoundException(
        `StudentAssignment with ID "${id}" not found`,
      );
    }
    return assignment;
  }

  async update(
    id: string,
    updateStudentAssignmentDto: UpdateStudentAssignmentDto,
  ): Promise<StudentAssignment> {
    const assignment = await this.findOne(id);
    Object.assign(assignment, updateStudentAssignmentDto);
    return await this.studentAssignmentRepository.save(assignment);
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.studentAssignmentRepository.remove(assignment);
  }
}
