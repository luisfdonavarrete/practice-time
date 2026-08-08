import { StudentDto } from '../dto/student.dto';
import { Student } from '../entities/student.entity';
import { plainToClass } from 'class-transformer';

export class StudentResponseMapper {
  static toDto(student: Student): StudentDto {
    return plainToClass(StudentDto, student);
  }

  static toDtoList(students: Student[]): StudentDto[] {
    return students.map((student) => this.toDto(student));
  }
}
