import { Link, useParams } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import { useAppDispatch } from '../app/hooks';
import {
  useGetAssignmentsQuery,
  useGetPracticeSummaryQuery,
} from '../features/assignments/assignments.api';
import type {
  PracticeItemProgress,
  StudentAssignment,
} from '../features/assignments/assignments.types';
import { isFetchBaseQueryError } from '../features/auth/is-fetch-base-query-error';
import { useOnlineStatus } from '../features/network/use-online-status';
import { useGetStudentsQuery } from '../features/students/students.api';
import { useAchievementSocket } from '../features/achievements/use-achievement-socket';
import { AchievementToast } from '../components/AchievementToast';
import { studentSelected } from '../features/students/student-context.slice';

export function DashboardPage() {
  const online = useOnlineStatus();
  const { studentId = '' } = useParams();
  const dispatch = useAppDispatch();
  const studentsQuery = useGetStudentsQuery();
  const assignmentsQuery = useGetAssignmentsQuery();
  const selectedStudent = studentsQuery.data?.data.find(
    (student) => student.id === studentId,
  );
  const assignments = (assignmentsQuery.data ?? []).filter(
    (assignment) => assignment.studentId === studentId,
  );
  const today = selectedStudent
    ? localDateInTimeZone(new Date(), selectedStudent.timeZone)
    : '';
  const currentAssignment = selectCurrentAssignment(assignments, today);
  const latestExpiredAssignment = selectLatestExpiredAssignment(
    assignments,
    today,
  );
  const progressQuery = useGetPracticeSummaryQuery(
    currentAssignment?.id ?? '',
    {
      skip: !currentAssignment,
    },
  );
  const { achievement: unlockedAchievement, dismiss: dismissAchievement } =
    useAchievementSocket(studentId || null, currentAssignment?.id ?? null);

  useEffect(() => {
    if (selectedStudent) dispatch(studentSelected(selectedStudent.id));
  }, [dispatch, selectedStudent]);

  if (!online) {
    return (
      <DashboardMessage
        eyebrow="Offline"
        title="Your connection is taking a rest."
        detail="Reconnect to load the latest assignment and practice progress. Nothing on this page will be changed."
      />
    );
  }

  if (studentsQuery.isLoading || assignmentsQuery.isLoading) {
    return <DashboardLoading />;
  }

  const accessError = studentsQuery.error ?? assignmentsQuery.error;
  if (accessError) {
    const denied =
      isFetchBaseQueryError(accessError) &&
      (accessError.status === 403 || accessError.status === 404);
    return (
      <DashboardMessage
        eyebrow={denied ? 'Access denied' : 'Could not load dashboard'}
        title={
          denied
            ? 'This student is not available.'
            : 'The music paused unexpectedly.'
        }
        detail={
          denied
            ? 'Choose another owned student or sign in with the account that owns this profile.'
            : 'Try loading the dashboard again. Your existing progress is still safe.'
        }
        action={
          <button
            type="button"
            className="secondary-button"
            onClick={() => void studentsQuery.refetch()}
          >
            Try again
          </button>
        }
      />
    );
  }

  if (!studentsQuery.data?.data.length) {
    return (
      <DashboardMessage
        eyebrow="Start here"
        title="Add the student you practice with."
        detail="Student profiles keep weekly assignments, local practice dates, and rewards together."
        action={
          <Link className="primary-link" to="/students/new">
            Add a student
          </Link>
        }
      />
    );
  }

  if (!selectedStudent) {
    return (
      <DashboardMessage
        eyebrow="Student unavailable"
        title="Choose a student to continue."
        detail="This student may have been deactivated or may not belong to this account."
        action={
          <Link className="primary-link" to="/students">
            Choose student
          </Link>
        }
      />
    );
  }

  if (!currentAssignment) {
    return (
      <DashboardMessage
        eyebrow={
          latestExpiredAssignment
            ? 'Week complete'
            : `Hello, ${selectedStudent.firstName}`
        }
        title={
          latestExpiredAssignment
            ? `${latestExpiredAssignment.title} has ended.`
            : 'Build the next seven days of practice.'
        }
        detail={
          latestExpiredAssignment
            ? 'The completed week remains in history. Duplicate it for a fresh week or create a new assignment.'
            : 'Create a weekly assignment with repertoire, theory, notices, and resources.'
        }
        action={
          <div className="button-row">
            <Link
              className="primary-link"
              to={`/students/${studentId}/assignments/new`}
            >
              Create assignment
            </Link>
            {latestExpiredAssignment && (
              <Link
                className="secondary-link"
                to={`/students/${studentId}/assignments/${latestExpiredAssignment.id}/duplicate`}
              >
                Duplicate last week
              </Link>
            )}
          </div>
        }
      />
    );
  }

  const progress = progressQuery.data;
  return (
    <section className="dashboard" aria-labelledby="dashboard-title">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">Today · {formatWeek(currentAssignment)}</p>
          <h1 id="dashboard-title">
            Ready to practice, {selectedStudent.firstName}?
          </h1>
          <p>Pick up where you left off or review this week’s goals.</p>
        </div>
      </header>

      <section
        className="today-assignment"
        aria-labelledby="current-assignment-title"
      >
        <div>
          <p className="eyebrow">Current assignment</p>
          <h2 id="current-assignment-title">{currentAssignment.title}</h2>
          <p>
            {progress
              ? `${progress.items.filter((item) => item.completed).length} of ${progress.items.length} goals complete`
              : 'Loading this week’s progress…'}
          </p>
        </div>
        <div className="today-assignment-actions">
          {currentAssignment.status === 'draft' ? (
            <Link
              className="primary-link"
              to={`/students/${studentId}/assignments/${currentAssignment.id}/edit`}
            >
              Finish assignment
            </Link>
          ) : (
            <Link
              className="primary-link"
              to={`/students/${studentId}/practice?assignment=${currentAssignment.id}`}
            >
              Start practice
            </Link>
          )}
          <details className="assignment-menu">
            <summary>More</summary>
            <div>
              <Link
                to={`/students/${studentId}/assignments/${currentAssignment.id}/duplicate`}
              >
                Duplicate week
              </Link>
              <Link to={`/students/${studentId}/assignments/new`}>
                New assignment
              </Link>
            </div>
          </details>
        </div>
      </section>

      {currentAssignment.notices.length > 0 && (
        <section className="notice-strip" aria-labelledby="notices-title">
          <h2 id="notices-title">Coming up</h2>
          <div className="notice-list">
            {currentAssignment.notices.map((notice) => (
              <article key={notice.id}>
                <strong>{notice.title}</strong>
                <span>{formatNotice(notice.occursAt, notice.location)}</span>
                {notice.details && <p>{notice.details}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      <section
        className="metric-grid today-metrics"
        aria-label="Weekly progress overview"
      >
        <Metric label="XP" value={progress ? String(progress.xp) : '—'} />
        <Metric
          label="Current streak"
          value={progress ? `${progress.currentStreak} days` : '—'}
        />
        <Metric
          label="Practice days"
          value={progress ? String(progress.distinctPracticeDays) : '—'}
        />
        <Metric
          label="Weekly minutes"
          value={progress ? String(progress.weeklyMinutes) : '—'}
        />
      </section>

      {progress && (
        <AssignmentProgress
          completed={progress.items.filter((item) => item.completed).length}
          total={progress.items.length}
        />
      )}

      {progressQuery.isError ? (
        <InlineStatus>
          Progress could not be refreshed. The assignment is still available.
        </InlineStatus>
      ) : progressQuery.isLoading ? (
        <InlineStatus>Calculating this week’s progress…</InlineStatus>
      ) : null}

      <div className="today-content">
        <section className="assignment-card" aria-labelledby="items-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Assignment</p>
              <h2 id="items-title">This week’s goals</h2>
            </div>
            <span className="completion-label">
              {progress?.assignmentCompleted
                ? 'All goals complete'
                : 'Keep going'}
            </span>
          </div>
          {currentAssignment.sections.length === 0 && (
            <InlineStatus>
              This assignment does not have any goals yet.
            </InlineStatus>
          )}
          {currentAssignment.sections.map((section) => (
            <div className="assignment-section" key={section.id}>
              <h3>{section.title}</h3>
              {section.items.map((item) => (
                <ItemTarget
                  key={item.id}
                  title={item.title}
                  dueAt={item.dueAt}
                  mode={item.completionMode}
                  progress={progress?.items.find(
                    (entry) => entry.itemId === item.id,
                  )}
                  target={item.suggestedPracticeDays ?? 1}
                />
              ))}
            </div>
          ))}
        </section>
      </div>

      {unlockedAchievement && (
        <AchievementToast
          achievement={unlockedAchievement}
          onDismiss={dismissAchievement}
        />
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ItemTarget({
  title,
  dueAt,
  mode,
  progress,
  target,
}: {
  title: string;
  dueAt: string | null;
  mode: 'practice_days' | 'one_time';
  progress?: PracticeItemProgress;
  target: number;
}) {
  const current = progress?.current ?? 0;
  const total = progress?.target ?? target;
  const complete = progress?.completed ?? false;
  return (
    <article className="item-target">
      <div>
        <strong>{title}</strong>
        <span>
          {dueAt
            ? `Due ${formatDate(dueAt)}`
            : mode === 'one_time'
              ? 'No due date'
              : 'Practice this week'}
        </span>
      </div>
      {mode === 'one_time' ? (
        <span className={`one-time-state${complete ? ' complete' : ''}`}>
          <span aria-hidden="true">{complete ? '✓' : '○'}</span>
          {complete ? 'Complete' : 'Not complete'}
        </span>
      ) : (
        <div
          className="target-progress"
          aria-label={`${current} of ${total} practice days complete`}
        >
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={index < current ? 'complete' : undefined}
              aria-hidden="true"
            />
          ))}
          <b>
            {current}/{total}
          </b>
        </div>
      )}
    </article>
  );
}

function AssignmentProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <section
      className="assignment-progress"
      aria-labelledby="assignment-progress-title"
    >
      <div>
        <strong id="assignment-progress-title">
          Weekly assignment completion
        </strong>
        <span>
          {completed} of {total} goals complete ({percentage}%)
        </span>
      </div>
      <progress value={completed} max={Math.max(total, 1)}>
        {percentage}%
      </progress>
    </section>
  );
}

function DashboardLoading() {
  return (
    <main className="dashboard-loading" aria-live="polite">
      <p>Preparing this week’s practice dashboard…</p>
    </main>
  );
}

function DashboardMessage({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <section className="dashboard-message">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{detail}</p>
      {action}
    </section>
  );
}

function InlineStatus({ children }: { children: ReactNode }) {
  return (
    <p className="inline-status" role="status">
      {children}
    </p>
  );
}

function selectCurrentAssignment(
  assignments: StudentAssignment[],
  today: string,
) {
  return assignments
    .filter(
      (assignment) =>
        assignment.startDate <= today && assignment.endDate >= today,
    )
    .filter(
      (assignment) =>
        assignment.status !== 'cancelled' && assignment.status !== 'archived',
    )
    .sort(
      (a, b) =>
        Number(b.status === 'published') - Number(a.status === 'published'),
    )[0];
}

function selectLatestExpiredAssignment(
  assignments: StudentAssignment[],
  today: string,
) {
  return assignments
    .filter(
      (assignment) =>
        assignment.endDate < today && assignment.status !== 'cancelled',
    )
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
}

function localDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

function formatWeek(assignment: StudentAssignment): string {
  return `${formatDate(assignment.startDate)} – ${formatDate(assignment.endDate)}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function formatNotice(
  occursAt: string | null,
  location: string | null,
): string {
  const date = occursAt
    ? new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(occursAt))
    : null;
  return (
    [date, location].filter(Boolean).join(' · ') || 'Details in the assignment'
  );
}
