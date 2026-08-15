import { api } from '../../app/api';
import type { PaginatedStudents } from './students.types';

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
  }),
});

export const { useGetStudentsQuery } = studentsApi;
