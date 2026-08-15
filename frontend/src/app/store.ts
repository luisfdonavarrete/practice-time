import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import { authReducer } from '../features/auth/auth.slice';
import { studentContextReducer } from '../features/students/student-context.slice';
import { uploadStatusReducer } from '../features/uploads/upload-status.slice';

export function createAppStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      studentContext: studentContextReducer,
      uploadStatus: uploadStatusReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });
}

export const store = createAppStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = ReturnType<typeof createAppStore>;
