import type { FormEvent } from 'react';
import type { SaveStudentRequest } from '../features/students/students.types';

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

export function StudentForm({
  form,
  submitLabel,
  busy,
  onChange,
  onCancel,
  onSubmit,
}: {
  form: SaveStudentRequest;
  submitLabel: string;
  busy: boolean;
  onChange: (form: SaveStudentRequest) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="student-form form-card" onSubmit={onSubmit}>
      <div className="form-grid">
        <label>
          First name
          <input
            value={form.firstName}
            maxLength={255}
            autoComplete="off"
            autoFocus
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
          {busy ? 'Saving…' : submitLabel}
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
