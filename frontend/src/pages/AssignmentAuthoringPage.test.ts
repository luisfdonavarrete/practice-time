import { describe, expect, it } from 'vitest';
import type { StudentAssignment } from '../features/assignments/assignments.types';
import { assignmentDraftTestSupport } from './AssignmentAuthoringPage';

describe('assignment authoring model', () => {
  it('derives an inclusive seven-day range across month boundaries', () => {
    expect(assignmentDraftTestSupport.addDays('2026-08-29', 6)).toBe(
      '2026-09-04',
    );
  });

  it('validates required structure and practice targets', () => {
    const draft = assignmentDraftTestSupport.emptyDraft('student-id');
    draft.title = 'Practice week';
    draft.sections[0].title = 'Repertoire';
    draft.sections[0].items[0].title = 'Amazing Grace';
    draft.sections[0].items[0].suggestedPracticeDays = 8;

    expect(assignmentDraftTestSupport.validateDraft(draft)).toContain(
      'Area 1, item 1 practice target must be between 1 and 7 days.',
    );
  });

  it('duplicates content into a clean draft without uploads or dated progress fields', () => {
    const source = {
      id: 'assignment-id',
      studentId: 'student-id',
      title: 'Recital week',
      description: 'Prepare the recital song.',
      startDate: '2026-06-15',
      endDate: '2026-06-21',
      status: 'published',
      notices: [
        {
          id: 'notice-id',
          title: 'Recital',
          occursAt: '2026-06-22T22:45:00.000Z',
          location: 'Room 213',
          details: null,
          position: 0,
        },
      ],
      sections: [
        {
          id: 'section-id',
          title: 'Repertoire',
          position: 0,
          items: [
            {
              id: 'item-id',
              title: 'Amazing Grace',
              instructions: 'Whole song',
              completionMode: 'practice_days',
              suggestedPracticeDays: 5,
              dueAt: '2026-06-20T12:00:00.000Z',
              position: 0,
              resources: [
                {
                  id: 'upload-id',
                  kind: 'upload',
                  displayName: 'Score',
                  originalFilename: 'score.pdf',
                  mimeType: 'application/pdf',
                  byteSize: 100,
                  url: null,
                  position: 0,
                },
                {
                  id: 'link-id',
                  kind: 'youtube',
                  displayName: 'Reference',
                  originalFilename: null,
                  mimeType: null,
                  byteSize: null,
                  url: 'https://youtu.be/example',
                  position: 1,
                },
              ],
            },
          ],
        },
      ],
    } satisfies StudentAssignment;

    const duplicate = assignmentDraftTestSupport.duplicateDraft(source);

    expect(duplicate.title).toBe('Recital week (copy)');
    expect(duplicate.notices[0].occursAt).toBe('');
    expect(duplicate.sections[0].items[0].dueAt).toBe('');
    expect(duplicate.sections[0].items[0].resources).toHaveLength(1);
    expect(duplicate.sections[0].items[0].resources[0].kind).toBe('youtube');
  });
});
