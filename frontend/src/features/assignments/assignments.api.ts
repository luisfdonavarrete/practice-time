import { api } from '../../app/api';
import type { ApiEnvelope } from '../auth/auth.types';
import type {
  Achievement,
  CreateStudentAssignment,
  PracticeSummary,
  StudentAssignment,
  UpdateStudentAssignment,
} from './assignments.types';

export const assignmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAssignments: builder.query<StudentAssignment[], void>({
      query: () => '/student-assignments',
      transformResponse: (response: ApiEnvelope<StudentAssignment[]>) =>
        response.data,
      providesTags: ['Assignments'],
    }),
    getAssignment: builder.query<StudentAssignment, string>({
      query: (assignmentId) => `/student-assignments/${assignmentId}`,
      transformResponse: (response: ApiEnvelope<StudentAssignment>) =>
        response.data,
      providesTags: (_result, _error, assignmentId) => [
        { type: 'Assignments', id: assignmentId },
      ],
    }),
    createAssignment: builder.mutation<
      StudentAssignment,
      CreateStudentAssignment
    >({
      query: (body) => ({ url: '/student-assignments', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<StudentAssignment>) =>
        response.data,
      invalidatesTags: ['Assignments'],
    }),
    updateAssignment: builder.mutation<
      StudentAssignment,
      { assignmentId: string; assignment: UpdateStudentAssignment }
    >({
      query: ({ assignmentId, assignment }) => ({
        url: `/student-assignments/${assignmentId}`,
        method: 'PATCH',
        body: assignment,
      }),
      transformResponse: (response: ApiEnvelope<StudentAssignment>) =>
        response.data,
      invalidatesTags: (_result, _error, { assignmentId }) => [
        'Assignments',
        { type: 'Assignments', id: assignmentId },
        { type: 'Progress', id: assignmentId },
      ],
    }),
    publishAssignment: builder.mutation<StudentAssignment, string>({
      query: (assignmentId) => ({
        url: `/student-assignments/${assignmentId}/publish`,
        method: 'POST',
      }),
      transformResponse: (response: ApiEnvelope<StudentAssignment>) =>
        response.data,
      invalidatesTags: (_result, _error, assignmentId) => [
        'Assignments',
        { type: 'Assignments', id: assignmentId },
      ],
    }),
    getPracticeSummary: builder.query<PracticeSummary, string>({
      query: (assignmentId) =>
        `/student-assignments/${assignmentId}/practice-summary`,
      transformResponse: (response: ApiEnvelope<PracticeSummary>) =>
        response.data,
      providesTags: (_result, _error, assignmentId) => [
        { type: 'Progress', id: assignmentId },
      ],
    }),
    getAchievements: builder.query<Achievement[], string>({
      query: (studentId) => `/students/${studentId}/achievements`,
      transformResponse: (response: ApiEnvelope<Achievement[]>) =>
        response.data,
      providesTags: (_result, _error, studentId) => [
        { type: 'Achievements', id: studentId },
      ],
    }),
    getResourceAccess: builder.query<
      { url: string; expiresInSeconds: number },
      string
    >({
      query: (resourceId) => `/assignment-resources/${resourceId}/access-url`,
      transformResponse: (
        response: ApiEnvelope<{ url: string; expiresInSeconds: number }>,
      ) => response.data,
    }),
    createPracticeSession: builder.mutation<
      { id: string; practiceLocalDate: string },
      {
        studentId: string;
        assignmentItemId: string;
        durationSeconds: number;
        practicedAt: string;
        note?: string;
        assignmentId: string;
      }
    >({
      query: (request) => ({
        url: '/practice-sessions',
        method: 'POST',
        body: {
          studentId: request.studentId,
          assignmentItemId: request.assignmentItemId,
          durationSeconds: request.durationSeconds,
          practicedAt: request.practicedAt,
          ...(request.note ? { note: request.note } : {}),
        },
      }),
      transformResponse: (
        response: ApiEnvelope<{ id: string; practiceLocalDate: string }>,
      ) => response.data,
      invalidatesTags: (_result, _error, request) => [
        { type: 'Progress', id: request.assignmentId },
        { type: 'Achievements', id: request.studentId },
      ],
    }),
    completeAssignmentItem: builder.mutation<
      void,
      { itemId: string; assignmentId: string; studentId: string }
    >({
      query: ({ itemId }) => ({
        url: `/student-assignment-items/${itemId}/completion`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, request) => [
        { type: 'Progress', id: request.assignmentId },
        { type: 'Achievements', id: request.studentId },
      ],
    }),
    reopenAssignmentItem: builder.mutation<
      void,
      { itemId: string; assignmentId: string; studentId: string }
    >({
      query: ({ itemId }) => ({
        url: `/student-assignment-items/${itemId}/completion`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, request) => [
        { type: 'Progress', id: request.assignmentId },
        { type: 'Achievements', id: request.studentId },
      ],
    }),
  }),
});

export const {
  useGetAssignmentsQuery,
  useGetAssignmentQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  usePublishAssignmentMutation,
  useGetPracticeSummaryQuery,
  useGetAchievementsQuery,
  useGetResourceAccessQuery,
  useCreatePracticeSessionMutation,
  useCompleteAssignmentItemMutation,
  useReopenAssignmentItemMutation,
} = assignmentsApi;
