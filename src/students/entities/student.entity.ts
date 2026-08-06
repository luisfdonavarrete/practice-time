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

  @Column({ nullable: true }) // for now, this should always be required
  school_id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ type: 'timestamptz' })
  date_of_birth: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // “This student has many StudentUser rows. In each of those rows, this student is the value of studentUser.student.”
  @OneToMany(() => StudentUser, (studentUser) => studentUser.student)
  user_accesses: StudentUser[];
}
