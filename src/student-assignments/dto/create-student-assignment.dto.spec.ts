import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateStudentAssignmentDto } from './create-student-assignment.dto';
import { AssignmentResourceKind } from '../entities/assignment-item-resource.entity';
import { AssignmentCompletionMode } from '../entities/student-assignment-item.entity';

const validAssignment = () => ({
  studentId: '9f7b9d70-854f-4689-9391-cf98c74ecbf4',
  title: 'Recital week',
  startDate: '2026-06-15',
  endDate: '2026-06-21',
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
          resources: [
            {
              kind: AssignmentResourceKind.UPLOAD,
              displayName: 'Sheet music',
              assetKey: 'assignments/amazing-grace.pdf',
              position: 0,
            },
            {
              kind: AssignmentResourceKind.YOUTUBE,
              displayName: 'Demonstration',
              url: 'https://www.youtube.com/watch?v=example',
              position: 1,
            },
          ],
        },
      ],
    },
  ],
});

describe('CreateStudentAssignmentDto', () => {
  const validatePayload = (payload: object) =>
    validate(plainToInstance(CreateStudentAssignmentDto, payload));

  it('accepts a structured seven-day assignment with multiple resources', async () => {
    await expect(validatePayload(validAssignment())).resolves.toEqual([]);
  });

  it('requires exactly seven local calendar days and a non-empty section', async () => {
    const payload = validAssignment();
    payload.endDate = '2026-06-22';
    payload.sections = [];

    const errors = await validatePayload(payload);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['endDate', 'sections']),
    );
  });

  it('rejects invalid completion targets and resource sources', async () => {
    const payload = validAssignment();
    const item = payload.sections[0].items[0];
    item.suggestedPracticeDays = 8;
    item.resources[0] = {
      kind: AssignmentResourceKind.UPLOAD,
      displayName: 'Invalid upload',
      assetKey: '',
      position: 0,
    };

    const errors = await validatePayload(payload);

    expect(errors.find((error) => error.property === 'sections')).toBeDefined();
  });
});
