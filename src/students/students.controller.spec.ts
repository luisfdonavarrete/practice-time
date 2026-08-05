import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';

describe('StudentsController', () => {
  let controller: StudentsController;
  let service: jest.Mocked<Pick<StudentsService, 'create' | 'findAll'>>;

  const student: Student = {
    id: 'bcb7d42d-aa7e-413b-aa10-9f08b70af73f',
    school_id: 'internal-school-id',
    user_id: 'internal-user-id',
    first_name: 'Ada',
    last_name: 'Lovelace',
    birthdate: new Date('1815-12-10T00:00:00.000Z'),
    created_at: new Date('2026-08-05T12:00:00.000Z'),
    updated_at: new Date('2026-08-05T12:00:00.000Z'),
  };
  const response = {
    id: student.id,
    first_name: student.first_name,
    last_name: student.last_name,
    birthdate: student.birthdate,
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
    };
    controller = new StudentsController(service as unknown as StudentsService);
  });

  it('maps a created entity to the public response', async () => {
    service.create.mockResolvedValue(student);

    await expect(
      controller.create({
        first_name: 'Ada',
        last_name: 'Lovelace',
        birthdate: student.birthdate,
      }),
    ).resolves.toEqual(response);
  });

  it('passes pagination through and maps every listed entity', async () => {
    service.findAll.mockResolvedValue({
      data: [student],
      meta: { page: 2, pageSize: 5, total: 6 },
    });

    await expect(controller.findAll({ page: 2, limit: 5 })).resolves.toEqual({
      data: [response],
      meta: { page: 2, pageSize: 5, total: 6 },
    });
    expect(service.findAll).toHaveBeenCalledWith({ page: 2, limit: 5 });
  });
});
