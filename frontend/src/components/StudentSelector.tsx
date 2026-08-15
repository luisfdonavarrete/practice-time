import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  studentSelected,
  studentSelectionCleared,
} from '../features/students/student-context.slice';
import { useGetStudentsQuery } from '../features/students/students.api';

const EMPTY_STUDENTS: never[] = [];

export function StudentSelector() {
  const dispatch = useAppDispatch();
  const selectedStudentId = useAppSelector(
    (state) => state.studentContext.selectedStudentId,
  );
  const { data, isLoading } = useGetStudentsQuery();
  const students = data?.data ?? EMPTY_STUDENTS;

  useEffect(() => {
    if (!data) return;
    if (students.length === 0) {
      if (selectedStudentId) dispatch(studentSelectionCleared());
      return;
    }
    if (!students.some((student) => student.id === selectedStudentId)) {
      dispatch(studentSelected(students[0].id));
    }
  }, [data, dispatch, selectedStudentId, students]);

  return (
    <label className="student-selector">
      <span>Student</span>
      <select
        aria-label="Selected student"
        value={selectedStudentId ?? ''}
        disabled={isLoading || students.length === 0}
        onChange={(event) => dispatch(studentSelected(event.target.value))}
      >
        {isLoading && <option value="">Loading…</option>}
        {!isLoading && students.length === 0 && (
          <option value="">No students yet</option>
        )}
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.firstName} {student.lastName}
          </option>
        ))}
      </select>
    </label>
  );
}
