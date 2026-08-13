import { ForbiddenException } from '@nestjs/common';
import { StudentUserRelationship } from '../entities/student-user.entity';
import { StudentUserService } from '../student-user.service';
import { StudentAction } from './student-access.permissions';
import { StudentAccessPolicyService } from './student-access-policy.service';

describe('StudentAccessPolicyService', () => {
  let studentUserService: jest.Mocked<
    Pick<StudentUserService, 'findActiveAccess'>
  >;
  let policy: StudentAccessPolicyService;

  beforeEach(() => {
    studentUserService = { findActiveAccess: jest.fn() };
    policy = new StudentAccessPolicyService(
      studentUserService as unknown as StudentUserService,
    );
  });

  it.each([
    StudentUserRelationship.SELF,
    StudentUserRelationship.PARENT,
    StudentUserRelationship.GUARDIAN,
    StudentUserRelationship.CAREGIVER,
  ])('allows %s relationships to view a student', async (relationship) => {
    studentUserService.findActiveAccess.mockResolvedValue({
      relationship,
    } as never);

    await expect(
      policy.can('user-id', StudentAction.View, 'student-id'),
    ).resolves.toBe(true);
  });

  it.each([
    StudentUserRelationship.SELF,
    StudentUserRelationship.PARENT,
    StudentUserRelationship.GUARDIAN,
  ])('allows %s relationships to manage a student', async (relationship) => {
    studentUserService.findActiveAccess.mockResolvedValue({
      relationship,
    } as never);

    await expect(
      policy.can('user-id', StudentAction.Manage, 'student-id'),
    ).resolves.toBe(true);
  });

  it.each([StudentUserRelationship.CAREGIVER, StudentUserRelationship.OTHER])(
    'does not allow %s relationships to manage a student',
    async (relationship) => {
      studentUserService.findActiveAccess.mockResolvedValue({
        relationship,
      } as never);

      await expect(
        policy.canManageStudent('user-id', 'student-id'),
      ).resolves.toBe(false);
    },
  );

  it('denies unrelated, revoked, and inactive-student access', async () => {
    studentUserService.findActiveAccess.mockResolvedValue(null);

    await expect(policy.canViewStudent('user-id', 'student-id')).resolves.toBe(
      false,
    );
    await expect(
      policy.assertCanViewStudent('user-id', 'student-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
