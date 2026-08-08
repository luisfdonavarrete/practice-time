import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StudentUser } from './student-user.entity';

@Entity()
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Optional login identity for students who can authenticate as users.
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'timestamptz' })
  dateOfBirth: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Users who can access this student as a parent, guardian, or other role.
  @OneToMany(() => StudentUser, (studentUser) => studentUser.student)
  userAccesses: StudentUser[];
}
