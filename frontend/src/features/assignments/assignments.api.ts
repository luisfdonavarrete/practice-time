import { api } from '../../app/api';
import type { ApiEnvelope } from '../auth/auth.types';
import type {
  Achievement,
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
  useGetPracticeSummaryQuery,
  useGetAchievementsQuery,
} = assignmentsApi;
