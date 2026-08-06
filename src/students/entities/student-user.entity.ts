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
@Index('IDX_student_users_user_id', ['user_id'])
export class StudentUser {
  @PrimaryColumn({ type: 'uuid' })
  student_id: string;

  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'enum', enum: StudentUserRelationship })
  relationship: StudentUserRelationship;

  @ManyToOne(() => Student, (student) => student.user_accesses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => User, (user) => user.student_accesses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
