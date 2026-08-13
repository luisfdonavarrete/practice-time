import { StudentAssignmentsController } from './student-assignments.controller';
import { StudentAssignmentsService } from './student-assignments.service';
import { StudentAssignment } from './entities/student-assignment.entity';

describe('StudentAssignmentsController', () => {
  const user = { userId: 'user-id', email: 'owner@example.com' };
  const assignment = {
    id: 'assignment-id',
    studentId: 'student-id',
    title: 'Practice week',
  } as StudentAssignment;
  let service: jest.Mocked<
    Pick<
      StudentAssignmentsService,
      'create' | 'findAll' | 'findOne' | 'update' | 'remove'
    >
  >;
  let controller: StudentAssignmentsController;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    controller = new StudentAssignmentsController(
      service as StudentAssignmentsService,
    );
  });

  it('creates an assignment through the authenticated owner', async () => {
    const dto = {
      studentId: assignment.studentId,
      title: assignment.title,
      startDate: new Date('2026-08-17'),
      endDate: new Date('2026-08-23'),
    };
    service.create.mockResolvedValue(assignment);

    await controller.create(dto, user);

    expect(service.create).toHaveBeenCalledWith(dto, user.userId);
  });

  it('scopes reads and deletes to the authenticated owner', async () => {
    service.findOne.mockResolvedValue(assignment);

    await controller.findOne(assignment.id, user);
    await controller.remove(assignment.id, user);

    expect(service.findOne).toHaveBeenCalledWith(user.userId, assignment.id);
    expect(service.remove).toHaveBeenCalledWith(user.userId, assignment.id);
  });
});
