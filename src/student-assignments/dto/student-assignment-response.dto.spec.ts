import 'reflect-metadata';
import { instanceToPlain } from 'class-transformer';
import { StudentAssignmentResponseDto } from './student-assignment-response.dto';
import { StudentAssignmentStatus } from '../entities/student-assignment.entity';

describe('StudentAssignmentResponseDto', () => {
  it('maps the structured assignment without exposing ownership relations', () => {
    const response = new StudentAssignmentResponseDto({
      id: 'assignment-id',
      studentId: 'student-id',
      title: 'Recital week',
      startDate: '2026-06-15',
      endDate: '2026-06-21',
      status: StudentAssignmentStatus.DRAFT,
      publishedAt: null,
      archivedAt: null,
      notices: [],
      sections: [],
      creatorUserId: 'private-user-id',
      creator: { email: 'private@example.com' },
    } as never);

    expect(instanceToPlain(response)).toEqual({
      id: 'assignment-id',
      studentId: 'student-id',
      title: 'Recital week',
      startDate: '2026-06-15',
      endDate: '2026-06-21',
      status: StudentAssignmentStatus.DRAFT,
      publishedAt: null,
      archivedAt: null,
      notices: [],
      sections: [],
    });
  });
});
