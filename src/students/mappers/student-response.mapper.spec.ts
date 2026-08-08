import { Paginated } from 'nestjs-paginate';
import { StudentDto } from '../dto/student.dto';
import { Student } from '../entities/student.entity';
import { StudentResponseMapper } from './student-response.mapper';

describe('StudentResponseMapper', () => {
  it('maps paginated entities while preserving metadata and links', () => {
    const student = Object.assign(new Student(), {
      id: '018f0542-f7c8-7d56-a4c8-53bffd426a9a',
      firstName: 'Test',
      lastName: 'Student',
      dateOfBirth: new Date('2000-01-01'),
      userId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const paginated = {
      data: [student],
      meta: {
        itemsPerPage: 20,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        sortBy: [['id', 'DESC']],
        searchBy: [],
        search: '',
        select: [],
      },
      links: { current: '/students?page=1&limit=20' },
    } as Paginated<Student>;

    const result = StudentResponseMapper.toDtoListFromPaginated(paginated);

    expect(result.data[0]).toBeInstanceOf(StudentDto);
    expect(result.data[0]).toEqual({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
    });
    expect(result.meta).toBe(paginated.meta);
    expect(result.links).toBe(paginated.links);
  });
});
