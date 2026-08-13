import { StudentUserRelationship } from '../entities/student-user.entity';

export enum StudentAction {
  View = 'view',
  Manage = 'manage',
}

export const STUDENT_RELATIONSHIP_PERMISSIONS: Readonly<
  Record<StudentAction, ReadonlySet<StudentUserRelationship>>
> = {
  [StudentAction.View]: new Set([
    StudentUserRelationship.SELF,
    StudentUserRelationship.PARENT,
    StudentUserRelationship.GUARDIAN,
    StudentUserRelationship.CAREGIVER,
  ]),
  [StudentAction.Manage]: new Set([
    StudentUserRelationship.SELF,
    StudentUserRelationship.PARENT,
    StudentUserRelationship.GUARDIAN,
  ]),
};
