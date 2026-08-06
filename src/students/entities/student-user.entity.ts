// can be used later
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { User } from '../../users/entities/user.entity';

export enum StudentUserRelationship {
  SELF = 'self',
  PARENT = 'parent',
  GUARDIAN = 'guardian',
  CAREGIVER = 'caregiver',
  OTHER = 'other',
}

@Entity('student_users')
export class StudentUser {
  @PrimaryColumn({ type: 'uuid' })
  student_id: string;

  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  // “This StudentAccess row belongs to one User, stored in user_id.
  //   On that User, the collection of matching StudentAccess rows is called studentAccesses.”

  @ManyToOne(() => Student, (student) => student.user_accesses)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => User, (user) => user.student_accesses)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
