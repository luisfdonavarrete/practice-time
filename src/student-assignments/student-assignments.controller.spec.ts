import { StudentAssignmentsController } from './student-assignments.controller';
import { StudentAssignmentsService } from './student-assignments.service';
import { StudentAssignment } from './entities/student-assignment.entity';
import { AssignmentCompletionMode } from './entities/student-assignment-item.entity';

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
      | 'create'
      | 'findAll'
      | 'findOne'
      | 'update'
      | 'publish'
      | 'duplicate'
      | 'archive'
      | 'cancel'
      | 'remove'
    >
  >;
  let controller: StudentAssignmentsController;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      publish: jest.fn(),
      duplicate: jest.fn(),
      archive: jest.fn(),
      cancel: jest.fn(),
      remove: jest.fn(),
    };
    controller = new StudentAssignmentsController(
      service as StudentAssignmentsService,
    );
  });

  it('publishes a draft through the authenticated owner', async () => {
    service.publish.mockResolvedValue(assignment);

    await controller.publish(assignment.id, user);

    expect(service.publish).toHaveBeenCalledWith(user.userId, assignment.id);
  });

  it('creates an assignment through the authenticated owner', async () => {
    const dto = {
      studentId: assignment.studentId,
      title: assignment.title,
      startDate: '2026-08-17',
      endDate: '2026-08-23',
      notices: [],
      sections: [
        {
          title: 'Repertoire',
          position: 0,
          items: [
            {
              title: 'Amazing Grace',
              completionMode: AssignmentCompletionMode.PRACTICE_DAYS,
              suggestedPracticeDays: 5,
              position: 0,
              resources: [],
            },
          ],
        },
      ],
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

  it('updates a draft through the authenticated owner', async () => {
    const dto = { title: 'Updated practice week' };
    service.update.mockResolvedValue(assignment);

    await controller.update(assignment.id, dto, user);

    expect(service.update).toHaveBeenCalledWith(
      assignment.id,
      user.userId,
      dto,
    );
  });

  it('duplicates, archives, and cancels through explicit commands', async () => {
    service.duplicate.mockResolvedValue(assignment);
    service.archive.mockResolvedValue(assignment);
    service.cancel.mockResolvedValue(assignment);

    await controller.duplicate(
      assignment.id,
      { startDate: '2026-08-17' },
      user,
    );
    await controller.archive(assignment.id, user);
    await controller.cancel(assignment.id, user);

    expect(service.duplicate).toHaveBeenCalledWith(
      user.userId,
      assignment.id,
      '2026-08-17',
    );
    expect(service.archive).toHaveBeenCalledWith(user.userId, assignment.id);
    expect(service.cancel).toHaveBeenCalledWith(user.userId, assignment.id);
  });
});
