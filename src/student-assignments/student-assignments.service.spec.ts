import { BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import {
  StudentAssignment,
  StudentAssignmentStatus,
} from './entities/student-assignment.entity';
import { StudentAssignmentsService } from './student-assignments.service';

describe('StudentAssignmentsService lifecycle', () => {
  let repository: jest.Mocked<
    Pick<Repository<StudentAssignment>, 'save' | 'remove'>
  >;
  let service: StudentAssignmentsService;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      remove: jest.fn(),
    };
    service = new StudentAssignmentsService(
      repository as Repository<StudentAssignment>,
      {} as Repository<Student>,
      {} as DataSource,
    );
  });

  it('publishes drafts and archives published assignments', async () => {
    const draft = assignment(StudentAssignmentStatus.DRAFT);
    const published = assignment(StudentAssignmentStatus.PUBLISHED);
    jest.spyOn(service, 'findOne').mockResolvedValue(draft);
    repository.save.mockResolvedValue(draft);

    await service.publish('owner-id', draft.id);

    expect(draft.status).toBe(StudentAssignmentStatus.PUBLISHED);
    expect(draft.publishedAt).toBeInstanceOf(Date);

    jest
      .spyOn(service, 'findOne')
      .mockReset()
      .mockResolvedValueOnce(published)
      .mockResolvedValueOnce(published);
    repository.save.mockResolvedValue(published);

    await service.archive('owner-id', published.id);

    expect(published.status).toBe(StudentAssignmentStatus.ARCHIVED);
    expect(published.archivedAt).toBeInstanceOf(Date);
  });

  it('allows cancellation only from draft or published states', async () => {
    const published = assignment(StudentAssignmentStatus.PUBLISHED);
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValueOnce(published)
      .mockResolvedValueOnce(published);
    repository.save.mockResolvedValue(published);

    await service.cancel('owner-id', published.id);

    expect(published.status).toBe(StudentAssignmentStatus.CANCELLED);

    const archived = assignment(StudentAssignmentStatus.ARCHIVED);
    jest.spyOn(service, 'findOne').mockReset().mockResolvedValue(archived);
    await expect(service.cancel('owner-id', archived.id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('deletes drafts but preserves published history', async () => {
    const draft = assignment(StudentAssignmentStatus.DRAFT);
    jest.spyOn(service, 'findOne').mockResolvedValueOnce(draft);
    repository.remove.mockResolvedValue(draft);

    await service.remove('owner-id', draft.id);

    expect(repository.remove).toHaveBeenCalledWith(draft);

    const published = assignment(StudentAssignmentStatus.PUBLISHED);
    jest.spyOn(service, 'findOne').mockReset().mockResolvedValue(published);
    await expect(service.remove('owner-id', published.id)).rejects.toThrow(
      BadRequestException,
    );
  });
});

function assignment(status: StudentAssignmentStatus): StudentAssignment {
  return {
    id: 'b69aa90d-7297-449e-8798-bec2e19fe74a',
    status,
    publishedAt: null,
    archivedAt: null,
  } as StudentAssignment;
}
