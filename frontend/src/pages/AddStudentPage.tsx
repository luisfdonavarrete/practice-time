import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { StudentForm } from '../components/StudentForm';
import { createEmptyStudentForm } from '../components/student-form.defaults';
import { isFetchBaseQueryError } from '../features/auth/is-fetch-base-query-error';
import { studentSelected } from '../features/students/student-context.slice';
import { useCreateStudentMutation } from '../features/students/students.api';
import type { SaveStudentRequest } from '../features/students/students.types';

export function AddStudentPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [createStudent, createState] = useCreateStudentMutation();
  const [form, setForm] = useState<SaveStudentRequest>(createEmptyStudentForm);
  const [formError, setFormError] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth) {
      setFormError(
        'Enter the student’s first name, last name, and date of birth.',
      );
      return;
    }

    try {
      const saved = await createStudent({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      }).unwrap();
      dispatch(studentSelected(saved.id));
      navigate(`/students/${saved.id}`, { replace: true });
    } catch (error) {
      setFormError(studentErrorMessage(error));
    }
  }

  return (
    <section
      className="student-create-page"
      aria-labelledby="add-student-title"
    >
      <Link className="back-link" to="/students">
        ← Back to students
      </Link>
      <header className="page-heading">
        <div>
          <p className="eyebrow">Student profile</p>
          <h1 id="add-student-title">Add a student</h1>
          <p>
            Create the workspace where assignments, practice history, streaks,
            and rewards will live.
          </p>
        </div>
      </header>

      {formError && (
        <div className="form-alert" role="alert">
          {formError}
        </div>
      )}

      <StudentForm
        form={form}
        submitLabel="Add student"
        busy={createState.isLoading}
        onChange={setForm}
        onCancel={() => navigate('/students')}
        onSubmit={(event) => void save(event)}
      />
    </section>
  );
}

function studentErrorMessage(error: unknown): string {
  if (isFetchBaseQueryError(error)) {
    if (error.status === 400)
      return 'Review the student details and choose a valid IANA time zone.';
    if (error.status === 'FETCH_ERROR')
      return 'The API could not be reached. Your changes were not saved.';
  }
  return 'The student could not be saved. Please try again.';
}
