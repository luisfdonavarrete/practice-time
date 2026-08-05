import { StudentResponseDto } from '../dto/student-response.dto';
import { Student } from '../entities/student.entity';

export class StudentResponseMapper {
  static toDto(student: Student): StudentResponseDto {
    return {
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      birthdate: student.birthdate,
    };
  }

  static toDtoList(students: Student[]): StudentResponseDto[] {
    return students.map((student) => this.toDto(student));
  }
}
