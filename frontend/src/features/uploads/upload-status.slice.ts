import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; fileName: string; progress: number }
  | { status: 'succeeded'; fileName: string }
  | { status: 'failed'; fileName: string; message: string };

const uploadStatusSlice = createSlice({
  name: 'uploadStatus',
  initialState: { status: 'idle' } as UploadState,
  reducers: {
    uploadStarted: (
      _state,
      action: PayloadAction<{ fileName: string }>,
    ): UploadState => ({
      status: 'uploading',
      fileName: action.payload.fileName,
      progress: 0,
    }),
    uploadProgressed: (state, action: PayloadAction<number>): UploadState =>
      state.status === 'uploading'
        ? { ...state, progress: Math.min(100, Math.max(0, action.payload)) }
        : state,
    uploadSucceeded: (
      _state,
      action: PayloadAction<{ fileName: string }>,
    ): UploadState => ({
      status: 'succeeded',
      fileName: action.payload.fileName,
    }),
    uploadFailed: (
      _state,
      action: PayloadAction<{ fileName: string; message: string }>,
    ): UploadState => ({ status: 'failed', ...action.payload }),
    uploadStatusCleared: (): UploadState => ({ status: 'idle' }),
  },
});

export const {
  uploadStarted,
  uploadProgressed,
  uploadSucceeded,
  uploadFailed,
  uploadStatusCleared,
} = uploadStatusSlice.actions;
export const uploadStatusReducer = uploadStatusSlice.reducer;
