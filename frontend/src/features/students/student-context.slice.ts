import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const SELECTED_STUDENT_KEY = 'practice-time.selected-student';

interface StudentContextState {
  selectedStudentId: string | null;
}

const studentContextSlice = createSlice({
  name: 'studentContext',
  initialState: (): StudentContextState => ({
    selectedStudentId:
      window.localStorage?.getItem(SELECTED_STUDENT_KEY) ?? null,
  }),
  reducers: {
    studentSelected(state, action: PayloadAction<string>) {
      state.selectedStudentId = action.payload;
      window.localStorage?.setItem(SELECTED_STUDENT_KEY, action.payload);
    },
    studentSelectionCleared(state) {
      state.selectedStudentId = null;
      window.localStorage?.removeItem(SELECTED_STUDENT_KEY);
    },
  },
});

export const { studentSelected, studentSelectionCleared } =
  studentContextSlice.actions;
export const studentContextReducer = studentContextSlice.reducer;
