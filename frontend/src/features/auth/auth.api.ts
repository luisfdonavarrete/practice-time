import { api } from '../../app/api';
import type {
  ApiEnvelope,
  CurrentUser,
  LoginCredentials,
  LoginResult,
} from './auth.types';

interface LoginApiResult {
  access_token: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResult, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: ApiEnvelope<LoginApiResult>) => ({
        accessToken: response.data.access_token,
      }),
    }),
    getCurrentUser: builder.query<CurrentUser, void>({
      query: () => '/auth/me',
      transformResponse: (response: ApiEnvelope<CurrentUser>) => response.data,
      providesTags: ['CurrentUser'],
    }),
  }),
});

export const { useLoginMutation, useGetCurrentUserQuery } = authApi;
