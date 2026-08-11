import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StudentUser } from '../../students/entities/student-user.entity';
import {
  USER_NAME_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
} from '../users.constants';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: USER_EMAIL_MAX_LENGTH, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: USER_NAME_MAX_LENGTH })
  firstName: string;

  @Column({ type: 'varchar', length: USER_NAME_MAX_LENGTH })
  lastName: string;

  @Column({ type: 'timestamptz' })
  dateOfBirth: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => StudentUser, (studentUser) => studentUser.user)
  studentAccesses: StudentUser[];
}
