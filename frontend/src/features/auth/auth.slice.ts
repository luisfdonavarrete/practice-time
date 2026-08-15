import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authStorage } from './auth-storage';
import type { CurrentUser } from './auth.types';

interface AuthState {
  accessToken: string | null;
  currentUser: CurrentUser | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: (): AuthState => ({
    accessToken: authStorage.read(),
    currentUser: null,
  }),
  reducers: {
    tokenReceived(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      state.currentUser = null;
    },
    sessionRestored(state, action: PayloadAction<CurrentUser>) {
      state.currentUser = action.payload;
    },
    loggedOut(state) {
      state.accessToken = null;
      state.currentUser = null;
    },
  },
});

export const { tokenReceived, sessionRestored, loggedOut } = authSlice.actions;
export const authReducer = authSlice.reducer;
