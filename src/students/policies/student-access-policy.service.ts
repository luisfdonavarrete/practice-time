import { ForbiddenException, Injectable } from '@nestjs/common';
import { StudentUserService } from '../student-user.service';

export enum StudentAction {
  View = 'View',
  Manage = 'Manage',
}

export interface StudentAccessPolicy {
  canViewStudent(userId: string, studentId: string): Promise<boolean>;
  canManageStudent(userId: string, studentId: string): Promise<boolean>;
  assertCanViewStudent(userId: string, studentId: string): Promise<void>;
  assertCanManageStudent(userId: string, studentId: string): Promise<void>;
}
@Injectable()
export class StudentAccessPolicyService implements StudentAccessPolicy {
  constructor(private readonly studentUserService: StudentUserService) {}
  async canViewStudent(userId: string, studentId: string): Promise<boolean> {
    const studentUser = await this.studentUserService.findOne(
      studentId,
      userId,
    );
    return !!studentUser;
  }
  async canManageStudent(userId: string, studentId: string): Promise<boolean> {
    const studentUser = await this.studentUserService.findOne(
      studentId,
      userId,
    );
    return !!studentUser;
  }
  async assertCanViewStudent(userId: string, studentId: string): Promise<void> {
    const canView = await this.canViewStudent(userId, studentId);
    if (!canView) {
      throw new ForbiddenException();
    }
  }
  async assertCanManageStudent(
    userId: string,
    studentId: string,
  ): Promise<void> {
    const canView = await this.canManageStudent(userId, studentId);
    if (!canView) {
      throw new ForbiddenException();
    }
  }
}
