import { StudentDto } from '../dto/student.dto';
import { Student } from '../entities/student.entity';
import { plainToClass } from 'class-transformer';
import { Paginated } from 'nestjs-paginate';

export class StudentResponseMapper {
  static toDto(student: Student): StudentDto {
    return plainToClass(StudentDto, student);
  }

  static toDtoList(students: Student[]): StudentDto[] {
    return students.map((student) => this.toDto(student));
  }

  static toDtoListFromPaginated(
    paginated: Paginated<Student>,
  ): Paginated<StudentDto> {
    return {
      ...paginated,
      data: StudentResponseMapper.toDtoList(paginated.data),
    } as Paginated<StudentDto>;
  }
}
