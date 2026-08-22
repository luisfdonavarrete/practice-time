import { api } from '../../app/api';
import type { ApiEnvelope } from '../auth/auth.types';
import type {
  PaginatedStudents,
  SaveStudentRequest,
  Student,
} from './students.types';

export const studentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<PaginatedStudents, void>({
      query: () => '/students?limit=100',
      transformResponse: (response: PaginatedStudents & { success: true }) => ({
        data: response.data,
        meta: response.meta,
      }),
      providesTags: ['Students'],
    }),
    createStudent: builder.mutation<Student, SaveStudentRequest>({
      query: (body) => ({ url: '/students', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<Student>) => response.data,
      invalidatesTags: ['Students'],
    }),
    updateStudent: builder.mutation<
      Student,
      { studentId: string; student: SaveStudentRequest }
    >({
      query: ({ studentId, student }) => ({
        url: `/students/${studentId}`,
        method: 'PATCH',
        body: student,
      }),
      transformResponse: (response: ApiEnvelope<Student>) => response.data,
      invalidatesTags: ['Students', 'Assignments', 'Progress'],
    }),
    deactivateStudent: builder.mutation<void, string>({
      query: (studentId) => ({
        url: `/students/${studentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Students', 'Assignments', 'Progress', 'Achievements'],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeactivateStudentMutation,
} = studentsApi;
