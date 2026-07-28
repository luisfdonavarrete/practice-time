import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class StudentAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  start_date: string;

  @Column()
  end_date: string;
}
