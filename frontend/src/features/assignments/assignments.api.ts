import { api } from '../../app/api';
import type { ApiEnvelope } from '../auth/auth.types';
import type {
  Achievement,
  CreateStudentAssignment,
  PracticeSummary,
  StudentAssignment,
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
  }),
});

export const {
  useGetAssignmentsQuery,
  useGetAssignmentQuery,
  useCreateAssignmentMutation,
  usePublishAssignmentMutation,
  useGetPracticeSummaryQuery,
  useGetAchievementsQuery,
} = assignmentsApi;
