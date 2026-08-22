import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { isFetchBaseQueryError } from '../features/auth/is-fetch-base-query-error';
import {
  studentSelected,
  studentSelectionCleared,
} from '../features/students/student-context.slice';
import {
  useCreateStudentMutation,
  useDeactivateStudentMutation,
  useGetStudentsQuery,
  useUpdateStudentMutation,
} from '../features/students/students.api';
import type {
  SaveStudentRequest,
  Student,
} from '../features/students/students.types';

const EMPTY_FORM: SaveStudentRequest = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
};

const FALLBACK_TIME_ZONES = [
  'UTC',
  'America/Toronto',
  'America/Vancouver',
  'America/Edmonton',
  'America/Winnipeg',
  'America/Halifax',
  'America/St_Johns',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
] as const;

export function StudentsPage({
  initialCreate = false,
}: {
  initialCreate?: boolean;
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedStudentId = useAppSelector(
    (state) => state.studentContext.selectedStudentId,
  );
  const studentsQuery = useGetStudentsQuery();
  const [createStudent, createState] = useCreateStudentMutation();
  const [updateStudent, updateState] = useUpdateStudentMutation();
  const [deactivateStudent, deactivateState] = useDeactivateStudentMutation();
  const [editingId, setEditingId] = useState<string | 'new' | null>(
    initialCreate ? 'new' : null,
  );
  const [form, setForm] = useState<SaveStudentRequest>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const students = studentsQuery.data?.data ?? [];
  const busy =
    createState.isLoading || updateState.isLoading || deactivateState.isLoading;

  function beginCreate() {
    setEditingId('new');
    setForm(EMPTY_FORM);
    setFormError(null);
  }

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
    if (initialCreate) navigate('/students', { replace: true });
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
      const saved =
        editingId === 'new'
          ? await createStudent(request).unwrap()
          : await updateStudent({
              studentId: editingId!,
              student: request,
            }).unwrap();
      setEditingId(null);
      if (editingId === 'new') {
        dispatch(studentSelected(saved.id));
        navigate(`/students/${saved.id}`, { replace: true });
      }
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
          <button
            type="button"
            className="primary-button"
            onClick={beginCreate}
          >
            Add student
          </button>
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
          isNew={editingId === 'new'}
          busy={busy}
          onChange={setForm}
          onCancel={closeForm}
          onSubmit={save}
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
              <button
                type="button"
                className="primary-button"
                onClick={beginCreate}
              >
                Add your first student
              </button>
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

function StudentForm({
  form,
  isNew,
  busy,
  onChange,
  onCancel,
  onSubmit,
}: {
  form: SaveStudentRequest;
  isNew: boolean;
  busy: boolean;
  onChange: (form: SaveStudentRequest) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="student-form form-card" onSubmit={onSubmit}>
      <h2>{isNew ? 'Add student' : 'Edit student'}</h2>
      <div className="form-grid">
        <label>
          First name
          <input
            value={form.firstName}
            maxLength={255}
            autoComplete="off"
            onChange={(event) =>
              onChange({ ...form, firstName: event.target.value })
            }
          />
        </label>
        <label>
          Last name
          <input
            value={form.lastName}
            maxLength={255}
            autoComplete="off"
            onChange={(event) =>
              onChange({ ...form, lastName: event.target.value })
            }
          />
        </label>
        <label>
          Date of birth
          <input
            type="date"
            value={form.dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) =>
              onChange({ ...form, dateOfBirth: event.target.value })
            }
          />
        </label>
        <label>
          Time zone
          <select
            value={form.timeZone}
            onChange={(event) =>
              onChange({ ...form, timeZone: event.target.value })
            }
          >
            {timeZoneOptions(form.timeZone).map((timeZone) => (
              <option key={timeZone} value={timeZone}>
                {timeZone}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="field-help">
        Practice dates are calculated in this time zone. Choose the student’s
        actual location, not the server location.
      </p>
      <div className="student-form-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={busy}>
          {busy ? 'Saving…' : isNew ? 'Add student' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function timeZoneOptions(current: string): string[] {
  const supported =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : [...FALLBACK_TIME_ZONES];
  return supported.includes(current) ? supported : [current, ...supported];
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
