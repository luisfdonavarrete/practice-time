import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { StudentForm } from '../components/StudentForm';
import { createEmptyStudentForm } from '../components/student-form.defaults';
import { isFetchBaseQueryError } from '../features/auth/is-fetch-base-query-error';
import {
  studentSelected,
  studentSelectionCleared,
} from '../features/students/student-context.slice';
import {
  useDeactivateStudentMutation,
  useGetStudentsQuery,
  useUpdateStudentMutation,
} from '../features/students/students.api';
import type {
  SaveStudentRequest,
  Student,
} from '../features/students/students.types';

export function StudentsPage() {
  const dispatch = useAppDispatch();
  const selectedStudentId = useAppSelector(
    (state) => state.studentContext.selectedStudentId,
  );
  const studentsQuery = useGetStudentsQuery();
  const [updateStudent, updateState] = useUpdateStudentMutation();
  const [deactivateStudent, deactivateState] = useDeactivateStudentMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SaveStudentRequest>(createEmptyStudentForm);
  const [formError, setFormError] = useState<string | null>(null);
  const students = studentsQuery.data?.data ?? [];
  const busy = updateState.isLoading || deactivateState.isLoading;

  function beginEdit(student: Student) {
    setEditingId(student.id);
    setForm({
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth.slice(0, 10),
      timeZone: student.timeZone,
    });
    setFormError(null);
  }

  function closeForm() {
    setEditingId(null);
    setFormError(null);
  }

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
      const request = {
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      };
      await updateStudent({
        studentId: editingId!,
        student: request,
      }).unwrap();
      setEditingId(null);
    } catch (error) {
      setFormError(studentErrorMessage(error));
    }
  }

  async function deactivate(student: Student) {
    const confirmed = window.confirm(
      `Deactivate ${student.firstName} ${student.lastName}? Their assignments and practice history will be preserved, but they will no longer appear in the active student list.`,
    );
    if (!confirmed) return;
    setFormError(null);
    try {
      await deactivateStudent(student.id).unwrap();
      if (selectedStudentId === student.id) dispatch(studentSelectionCleared());
      if (editingId === student.id) setEditingId(null);
    } catch (error) {
      setFormError(studentErrorMessage(error));
    }
  }

  return (
    <section className="students-page" aria-labelledby="students-title">
      <header className="students-heading">
        <div>
          <p className="eyebrow">Student profiles</p>
          <h1 id="students-title">Who is practicing?</h1>
          <p>
            Student time zones determine practice days, streaks, and weekly
            progress.
          </p>
        </div>
        {!editingId && (
          <Link className="primary-link" to="/students/new">
            Add student
          </Link>
        )}
      </header>

      {formError && (
        <div className="form-alert" role="alert">
          {formError}
        </div>
      )}

      {editingId && (
        <StudentForm
          form={form}
          submitLabel="Save changes"
          busy={busy}
          onChange={setForm}
          onCancel={closeForm}
          onSubmit={(event) => void save(event)}
        />
      )}

      {studentsQuery.isLoading && (
        <p className="students-status">Loading students…</p>
      )}
      {studentsQuery.isError && (
        <div className="form-alert" role="alert">
          Students could not be loaded. Try refreshing the page.
        </div>
      )}
      {!studentsQuery.isLoading &&
        !studentsQuery.isError &&
        students.length === 0 && (
          <div className="students-empty">
            <h2>Add the student you practice with.</h2>
            <p>Create a student profile before building a weekly assignment.</p>
            {!editingId && (
              <Link className="primary-link" to="/students/new">
                Add your first student
              </Link>
            )}
          </div>
        )}
      {students.length > 0 && (
        <div className="student-card-grid">
          {students.map((student) => (
            <article className="student-card" key={student.id}>
              <div>
                <p className="eyebrow">Student workspace</p>
                <h2>
                  {student.firstName} {student.lastName}
                </h2>
                <dl>
                  <div>
                    <dt>Date of birth</dt>
                    <dd>{formatStudentDate(student.dateOfBirth)}</dd>
                  </div>
                  <div>
                    <dt>Time zone</dt>
                    <dd>{student.timeZone}</dd>
                  </div>
                </dl>
              </div>
              <div className="student-card-actions">
                <Link
                  className="primary-link"
                  to={`/students/${student.id}`}
                  onClick={() => dispatch(studentSelected(student.id))}
                >
                  Open workspace
                </Link>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => beginEdit(student)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="danger-link"
                  disabled={busy}
                  onClick={() => void deactivate(student)}
                >
                  Deactivate
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatStudentDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function studentErrorMessage(error: unknown): string {
  if (isFetchBaseQueryError(error)) {
    if (error.status === 400)
      return 'Review the student details and choose a valid IANA time zone.';
    if (error.status === 404)
      return 'That student is no longer available to this account.';
    if (error.status === 'FETCH_ERROR')
      return 'The API could not be reached. Your changes were not saved.';
  }
  return 'The student could not be saved. Please try again.';
}
