// can be used later
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
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
@Index('IDX_student_users_user_id', ['userId'])
export class StudentUser {
  @PrimaryColumn({ type: 'uuid' })
  studentId: string;

  @PrimaryColumn({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: StudentUserRelationship })
  relationship: StudentUserRelationship;

  @ManyToOne(() => Student, (student) => student.userAccesses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => User, (user) => user.studentAccesses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
