import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { environment } from '../config/env';
import { authStorage } from '../features/auth/auth-storage';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: environment.apiBaseUrl,
    prepareHeaders: (headers) => {
      const accessToken = authStorage.read();
      if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
      return headers;
    },
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
