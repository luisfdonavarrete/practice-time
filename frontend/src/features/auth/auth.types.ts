export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
}

export interface ApiEnvelope<T> {
  success: true;
  data: T;
}
