import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';

describe('StudentsController', () => {
  const user = { userId: 'user-id', email: 'owner@example.com' };
  const student = {
    id: 'student-id',
    firstName: 'Alex',
    lastName: 'Student',
    dateOfBirth: new Date('2014-05-15'),
  } as Student;
  let service: jest.Mocked<
    Pick<StudentsService, 'create' | 'findOneOwnedBy' | 'update' | 'deactivate'>
  >;
  let controller: StudentsController;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findOneOwnedBy: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };
    controller = new StudentsController(service as StudentsService);
  });

  it('creates a student for the authenticated owner', async () => {
    const dto = {
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
    };
    service.create.mockResolvedValue(student);

    await controller.create(dto, user);

    expect(service.create).toHaveBeenCalledWith(dto, user.userId);
  });

  it('retrieves a student through an owner-scoped service method', async () => {
    service.findOneOwnedBy.mockResolvedValue(student);

    await controller.findOne(student.id, user);

    expect(service.findOneOwnedBy).toHaveBeenCalledWith(
      user.userId,
      student.id,
    );
  });

  it('updates and deactivates through the authenticated owner', async () => {
    const update = { firstName: 'Updated' };
    service.update.mockResolvedValue({ ...student, ...update });

    await controller.update(student.id, update, user);
    await controller.deactivate(student.id, user);

    expect(service.update).toHaveBeenCalledWith(
      user.userId,
      student.id,
      update,
    );
    expect(service.deactivate).toHaveBeenCalledWith(user.userId, student.id);
  });
});
