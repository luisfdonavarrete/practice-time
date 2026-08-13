import { ForbiddenException, Injectable } from '@nestjs/common';
import { StudentUserService } from '../student-user.service';
import {
  STUDENT_RELATIONSHIP_PERMISSIONS,
  StudentAction,
} from './student-access.permissions';

export { StudentAction } from './student-access.permissions';

export interface StudentAccessPolicy {
  can(
    userId: string,
    action: StudentAction,
    studentId: string,
  ): Promise<boolean>;
  canViewStudent(userId: string, studentId: string): Promise<boolean>;
  canManageStudent(userId: string, studentId: string): Promise<boolean>;
  assertCanViewStudent(userId: string, studentId: string): Promise<void>;
  assertCanManageStudent(userId: string, studentId: string): Promise<void>;
}
@Injectable()
export class StudentAccessPolicyService implements StudentAccessPolicy {
  constructor(private readonly studentUserService: StudentUserService) {}

  async can(
    userId: string,
    action: StudentAction,
    studentId: string,
  ): Promise<boolean> {
    const studentUser = await this.studentUserService.findActiveAccess(
      studentId,
      userId,
    );
    if (!studentUser) return false;

    return STUDENT_RELATIONSHIP_PERMISSIONS[action].has(
      studentUser.relationship,
    );
  }

  canViewStudent(userId: string, studentId: string): Promise<boolean> {
    return this.can(userId, StudentAction.View, studentId);
  }

  canManageStudent(userId: string, studentId: string): Promise<boolean> {
    return this.can(userId, StudentAction.Manage, studentId);
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
    const canManage = await this.canManageStudent(userId, studentId);
    if (!canManage) {
      throw new ForbiddenException();
    }
  }
}
