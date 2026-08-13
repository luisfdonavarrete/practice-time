import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentUser } from './entities/student-user.entity';
import { IsNull, Repository } from 'typeorm';

@Injectable()
export class StudentUserService {
  constructor(
    @InjectRepository(StudentUser)
    private readonly studentUserRepository: Repository<StudentUser>,
  ) {}

  findActiveAccess(
    studentId: string,
    userId: string,
  ): Promise<StudentUser | null> {
    return this.studentUserRepository.findOne({
      where: {
        studentId,
        userId,
        revokedAt: IsNull(),
        student: { isActive: true },
      },
      relations: { student: true },
    });
  }
}
