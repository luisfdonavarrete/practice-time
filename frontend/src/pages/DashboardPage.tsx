import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAppSelector } from '../app/hooks';
import {
  useGetAchievementsQuery,
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

export function DashboardPage() {
  const online = useOnlineStatus();
  const selectedStudentId = useAppSelector(
    (state) => state.studentContext.selectedStudentId,
  );
  const studentsQuery = useGetStudentsQuery();
  const assignmentsQuery = useGetAssignmentsQuery();
  const selectedStudent = studentsQuery.data?.data.find(
    (student) => student.id === selectedStudentId,
  );
  const assignments = (assignmentsQuery.data ?? []).filter(
    (assignment) => assignment.studentId === selectedStudentId,
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
  const achievementsQuery = useGetAchievementsQuery(selectedStudentId ?? '', {
    skip: !selectedStudentId,
  });

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

  if (!selectedStudent) return <DashboardLoading />;

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
            <Link className="primary-link" to="/assignments/new">
              Create assignment
            </Link>
            {latestExpiredAssignment && (
              <Link
                className="secondary-link"
                to={`/assignments/${latestExpiredAssignment.id}/duplicate`}
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
  const achievements = achievementsQuery.data ?? [];

  return (
    <section className="dashboard" aria-labelledby="dashboard-title">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">{formatWeek(currentAssignment)}</p>
          <h1 id="dashboard-title">
            {selectedStudent.firstName}’s practice week
          </h1>
          <p>{currentAssignment.title}</p>
        </div>
        <div className="button-row dashboard-actions">
          <Link
            className="primary-link"
            to={`/practice?assignment=${currentAssignment.id}`}
          >
            Continue practice
          </Link>
          <Link
            className="secondary-link"
            to={`/assignments/${currentAssignment.id}/duplicate`}
          >
            Duplicate week
          </Link>
          <Link className="text-link" to="/assignments/new">
            New assignment
          </Link>
        </div>
      </header>

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

      <section className="metric-grid" aria-label="Weekly progress overview">
        <Metric
          label="XP earned"
          value={progress ? String(progress.xp) : '—'}
        />
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

      {progressQuery.isError ? (
        <InlineStatus>
          Progress could not be refreshed. The assignment is still available.
        </InlineStatus>
      ) : progressQuery.isLoading ? (
        <InlineStatus>Calculating this week’s progress…</InlineStatus>
      ) : null}

      <div className="dashboard-columns">
        <section className="assignment-card" aria-labelledby="items-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Assignment</p>
              <h2 id="items-title">This week’s goals</h2>
            </div>
            <Link className="text-link" to="/progress">
              View all progress
            </Link>
          </div>
          {currentAssignment.sections.map((section) => (
            <div className="assignment-section" key={section.id}>
              <h3>{section.title}</h3>
              {section.items.map((item) => (
                <ItemTarget
                  key={item.id}
                  title={item.title}
                  dueAt={item.dueAt}
                  progress={progress?.items.find(
                    (entry) => entry.itemId === item.id,
                  )}
                  target={item.suggestedPracticeDays ?? 1}
                />
              ))}
            </div>
          ))}
        </section>

        <aside className="reward-card" aria-labelledby="rewards-title">
          <p className="eyebrow">Achievements</p>
          <h2 id="rewards-title">Progress worth celebrating</h2>
          {achievementsQuery.isLoading && <p>Loading achievements…</p>}
          {achievementsQuery.isError && (
            <p>Achievements will return when the connection recovers.</p>
          )}
          {!achievementsQuery.isLoading && achievements.length === 0 && (
            <p>Complete the first practice session to unlock a badge.</p>
          )}
          <ul className="achievement-list">
            {achievements
              .slice(-3)
              .reverse()
              .map((achievement) => (
                <li key={achievement.id}>
                  <span aria-hidden="true">★</span>
                  <div>
                    <strong>{achievement.title}</strong>
                    <p>{achievement.description}</p>
                  </div>
                </li>
              ))}
          </ul>
        </aside>
      </div>
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
  progress,
  target,
}: {
  title: string;
  dueAt: string | null;
  progress?: PracticeItemProgress;
  target: number;
}) {
  const current = progress?.current ?? 0;
  const total = progress?.target ?? target;
  return (
    <article className="item-target">
      <div>
        <strong>{title}</strong>
        <span>{dueAt ? `Due ${formatDate(dueAt)}` : 'Practice this week'}</span>
      </div>
      <div
        className="target-progress"
        aria-label={`${current} of ${total} complete`}
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
    </article>
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
