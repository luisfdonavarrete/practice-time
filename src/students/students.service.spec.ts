import { Repository } from 'typeorm';
import { CreateStudentDto } from './dto/create-student.dto';
import { Student } from './entities/student.entity';
import { StudentsService } from './students.service';

describe('StudentsService', () => {
  let service: StudentsService;
  let repository: jest.Mocked<
    Pick<Repository<Student>, 'create' | 'save' | 'findAndCount'>
  >;

  const student: Student = {
    id: 'bcb7d42d-aa7e-413b-aa10-9f08b70af73f',
    school_id: 'internal-school-id',
    user_id: 'internal-user-id',
    first_name: 'Ada',
    last_name: 'Lovelace',
    date_of_birth: new Date('1815-12-10T00:00:00.000Z'),
    is_active: true,
    created_at: new Date('2026-08-05T12:00:00.000Z'),
    updated_at: new Date('2026-08-05T12:00:00.000Z'),
    user_accesses: [],
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
    };
    service = new StudentsService(repository as unknown as Repository<Student>);
  });

  describe('create', () => {
    it('creates and saves one student', async () => {
      const dto: CreateStudentDto = {
        first_name: 'Ada',
        last_name: 'Lovelace',
        birthdate: student.date_of_birth,
      };
      repository.create.mockReturnValue(student);
      repository.save.mockResolvedValue(student);

      await expect(service.create(dto)).resolves.toBe(student);
      expect(repository.create).toHaveBeenCalledWith({
        first_name: dto.first_name,
        last_name: dto.last_name,
        date_of_birth: dto.birthdate,
      });
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledWith(student);
    });
  });

  describe('findAll', () => {
    it('returns one paginated query result with stable ordering', async () => {
      repository.findAndCount.mockResolvedValue([[student], 41]);

      await expect(service.findAll({ page: 3, limit: 10 })).resolves.toEqual({
        data: [student],
        meta: { page: 3, pageSize: 10, total: 41 },
      });
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
        order: { created_at: 'DESC', id: 'ASC' },
      });
    });

    it('returns an empty page without a second query', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await expect(service.findAll({ page: 1, limit: 20 })).resolves.toEqual({
        data: [],
        meta: { page: 1, pageSize: 20, total: 0 },
      });
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
    });
  });
});
