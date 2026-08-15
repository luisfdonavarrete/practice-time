import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { environment } from '../config/env';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: environment.apiBaseUrl,
    credentials: 'include',
  }),
  tagTypes: [
    'CurrentUser',
    'Students',
    'Assignments',
    'Progress',
    'Achievements',
  ],
  endpoints: () => ({}),
});
