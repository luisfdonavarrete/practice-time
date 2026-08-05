import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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
  birthdate: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
