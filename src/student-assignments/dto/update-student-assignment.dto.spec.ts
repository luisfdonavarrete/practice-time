import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AssignmentCompletionMode } from '../entities/student-assignment-item.entity';
import { UpdateStudentAssignmentDto } from './update-student-assignment.dto';

describe('UpdateStudentAssignmentDto', () => {
  const validatePayload = (payload: object) =>
    validate(plainToInstance(UpdateStudentAssignmentDto, payload));

  it('accepts a full draft replacement with a retained upload', async () => {
    await expect(
      validatePayload({
        title: 'Updated recital week',
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
                resources: [],
                retainedUploads: [
                  {
                    id: '10d99bb3-a33d-409a-ae97-72b57bfae1d0',
                    displayName: 'Score',
                    position: 0,
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).resolves.toEqual([]);
  });

  it('rejects malformed retained upload identifiers', async () => {
    const errors = await validatePayload({
      sections: [
        {
          title: 'Repertoire',
          position: 0,
          items: [
            {
              title: 'Amazing Grace',
              completionMode: AssignmentCompletionMode.ONE_TIME,
              position: 0,
              resources: [],
              retainedUploads: [
                { id: 'not-a-uuid', displayName: 'Score', position: 0 },
              ],
            },
          ],
        },
      ],
    });

    expect(errors.find((error) => error.property === 'sections')).toBeDefined();
  });
});
