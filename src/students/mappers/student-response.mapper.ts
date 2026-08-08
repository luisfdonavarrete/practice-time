import { StudentDto } from '../dto/student.dto';
import { Student } from '../entities/student.entity';
import { plainToInstance } from 'class-transformer';
import { Paginated } from 'nestjs-paginate';
import { PaginatedStudentDto } from '../dto/paginated-students.dto';

export class StudentResponseMapper {
  static toDto(student: Student): StudentDto {
    return plainToInstance(StudentDto, student, {
      excludeExtraneousValues: true,
    });
  }

  static toDtoList(students: Student[]): StudentDto[] {
    return students.map((student) => this.toDto(student));
  }

  static toDtoListFromPaginated(
    paginated: Paginated<Student>,
  ): PaginatedStudentDto {
    return {
      ...paginated,
      data: StudentResponseMapper.toDtoList(paginated.data),
    };
  }
}
