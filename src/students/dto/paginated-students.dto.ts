import { Paginated } from 'nestjs-paginate';
import { Student } from '../entities/student.entity';
import { StudentDto } from './student.dto';

export type PaginatedStudentDto = Omit<Paginated<Student>, 'data'> & {
  data: StudentDto[];
};
