import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStudentAssignmentDto } from './dto/create-student-assignment.dto';
import { UpdateStudentAssignmentDto } from './dto/update-student-assignment.dto';
import { StudentAssignment } from './entities/student-assignment.entity';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class StudentAssignmentsService {
  constructor(
    @InjectRepository(StudentAssignment)
    private readonly studentAssignmentRepository: Repository<StudentAssignment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(
    createStudentAssignmentDto: CreateStudentAssignmentDto,
    ownerUserId: string,
  ): Promise<StudentAssignment> {
    await this.studentRepository.findOneOrFail({
      where: {
        id: createStudentAssignmentDto.studentId,
        ownerUserId,
        isActive: true,
      },
    });
    const assignment = this.studentAssignmentRepository.create({
      ...createStudentAssignmentDto,
      creatorUserId: ownerUserId,
    });
    return this.studentAssignmentRepository.save(assignment);
  }

  findAll(ownerUserId: string): Promise<StudentAssignment[]> {
    return this.studentAssignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.student', 'student')
      .where('student.owner_user_id = :ownerUserId', { ownerUserId })
      .orderBy('assignment.created_at', 'DESC')
      .getMany();
  }

  async findOne(ownerUserId: string, id: string): Promise<StudentAssignment> {
    const assignment = await this.studentAssignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.student', 'student')
      .where('assignment.id = :id', { id })
      .andWhere('student.owner_user_id = :ownerUserId', { ownerUserId })
      .getOne();
    if (!assignment) {
      throw new NotFoundException(
        `StudentAssignment with ID "${id}" not found`,
      );
    }
    return assignment;
  }

  async update(
    id: string,
    ownerUserId: string,
    updateStudentAssignmentDto: UpdateStudentAssignmentDto,
  ): Promise<StudentAssignment> {
    const assignment = await this.findOne(ownerUserId, id);
    Object.assign(assignment, updateStudentAssignmentDto);
    return this.studentAssignmentRepository.save(assignment);
  }

  async remove(ownerUserId: string, id: string): Promise<void> {
    const assignment = await this.findOne(ownerUserId, id);
    await this.studentAssignmentRepository.remove(assignment);
  }
}
