import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Metronome } from '../components/Metronome';
import { ResourceViewer } from '../components/ResourceViewer';
import { AchievementToast } from '../components/AchievementToast';
import {
  useCompleteAssignmentItemMutation,
  useCreatePracticeSessionMutation,
  useGetAssignmentsQuery,
  useGetPracticeSummaryQuery,
  useReopenAssignmentItemMutation,
} from '../features/assignments/assignments.api';
import type {
  AssignmentItem,
  AssignmentSection,
  StudentAssignment,
} from '../features/assignments/assignments.types';
import { useAchievementSocket } from '../features/achievements/use-achievement-socket';
import { useOnlineStatus } from '../features/network/use-online-status';
import { useGetStudentsQuery } from '../features/students/students.api';

export function PracticePlayerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const online = useOnlineStatus();
  const { studentId = '' } = useParams();
  const students = useGetStudentsQuery();
  const assignments = useGetAssignmentsQuery();
  const selectedStudent = students.data?.data.find(
    (student) => student.id === studentId,
  );
  const requestedAssignmentId = searchParams.get('assignment');
  const assignment = selectAssignment(
    assignments.data ?? [],
    studentId,
    requestedAssignmentId,
    selectedStudent?.timeZone,
  );
  const allItems = useMemo(
    () => assignment?.sections.flatMap((section) => section.items) ?? [],
    [assignment],
  );
  const requestedItemId = searchParams.get('item');
  const selectedItem =
    allItems.find((item) => item.id === requestedItemId) ?? allItems[0];
  const progress = useGetPracticeSummaryQuery(assignment?.id ?? '', {
    skip: !assignment,
  });
  const selectedProgress = progress.data?.items.find(
    (item) => item.itemId === selectedItem?.id,
  );
  const { achievement, dismiss } = useAchievementSocket(
    studentId || null,
    assignment?.id ?? null,
  );

  function selectItem(itemId: string) {
    const next = new URLSearchParams(searchParams);
    if (assignment) next.set('assignment', assignment.id);
    next.set('item', itemId);
    setSearchParams(next, { replace: true });
  }

  if (!online) {
    return (
      <PracticeMessage
        title="Practice tools are waiting for your connection."
        detail="Reconnect before starting a timed session so the completed practice can be recorded safely."
      />
    );
  }
  if (students.isLoading || assignments.isLoading) {
    return (
      <main className="authoring-loading">Opening the practice room…</main>
    );
  }
  if (!selectedStudent || !assignment || !selectedItem) {
    return (
      <PracticeMessage
        title="There is no active practice assignment."
        detail="Choose a student with a current assignment or create the next practice week."
      />
    );
  }

  return (
    <section className="practice-player" aria-labelledby="practice-title">
      <header className="practice-heading">
        <div>
          <p className="eyebrow">{assignment.title}</p>
          <h1 id="practice-title">Practice with {selectedStudent.firstName}</h1>
          <p>{formatDateRange(assignment.startDate, assignment.endDate)}</p>
        </div>
        <Link className="text-link" to={`/students/${studentId}`}>
          Back to dashboard
        </Link>
      </header>

      {assignment.notices.length > 0 && (
        <details className="practice-notices">
          <summary>
            {assignment.notices.length} notice
            {assignment.notices.length === 1 ? '' : 's'} for this week
          </summary>
          {assignment.notices.map((notice) => (
            <article key={notice.id}>
              <strong>{notice.title}</strong>
              <span>
                {[
                  notice.occursAt ? formatDateTime(notice.occursAt) : null,
                  notice.location,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              {notice.details && <p>{notice.details}</p>}
            </article>
          ))}
        </details>
      )}

      <div className="practice-layout">
        <nav className="practice-outline" aria-label="Assignment items">
          {assignment.sections.map((section) => (
            <PracticeSection
              key={section.id}
              section={section}
              selectedItemId={selectedItem.id}
              progress={progress.data?.items ?? []}
              onSelect={selectItem}
            />
          ))}
        </nav>

        <main className="practice-workspace">
          <ItemWorkspace
            key={selectedItem.id}
            assignment={assignment}
            studentId={selectedStudent.id}
            item={selectedItem}
            completed={selectedProgress?.completed ?? false}
          />
        </main>
      </div>

      {achievement && (
        <AchievementToast achievement={achievement} onDismiss={dismiss} />
      )}
    </section>
  );
}

function PracticeSection({
  section,
  selectedItemId,
  progress,
  onSelect,
}: {
  section: AssignmentSection;
  selectedItemId: string;
  progress: Array<{
    itemId: string;
    current: number;
    target: number;
    completed: boolean;
  }>;
  onSelect: (itemId: string) => void;
}) {
  return (
    <section>
      <h2>{section.title}</h2>
      {section.items.map((item) => {
        const itemProgress = progress.find((entry) => entry.itemId === item.id);
        return (
          <button
            key={item.id}
            type="button"
            className={item.id === selectedItemId ? 'selected' : undefined}
            aria-current={item.id === selectedItemId ? 'step' : undefined}
            onClick={() => onSelect(item.id)}
          >
            <span>{item.title}</span>
            <small>
              {itemProgress?.completed
                ? 'Complete'
                : `${itemProgress?.current ?? 0}/${itemProgress?.target ?? item.suggestedPracticeDays ?? 1}`}
            </small>
          </button>
        );
      })}
    </section>
  );
}

function ItemWorkspace({
  assignment,
  studentId,
  item,
  completed,
}: {
  assignment: StudentAssignment;
  studentId: string;
  item: AssignmentItem;
  completed: boolean;
}) {
  const [resourceId, setResourceId] = useState(item.resources[0]?.id ?? null);
  const [running, setRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [createSession, createState] = useCreatePracticeSessionMutation();
  const [completeItem, completeState] = useCompleteAssignmentItemMutation();
  const [reopenItem, reopenState] = useReopenAssignmentItemMutation();
  const selectedResource =
    item.resources.find((resource) => resource.id === resourceId) ??
    item.resources[0];

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(
      () => setElapsedSeconds((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [running]);

  async function finishSession() {
    if (elapsedSeconds < 1) {
      setMessage('Practice for at least one second before finishing.');
      return;
    }
    setRunning(false);
    setMessage(null);
    try {
      const result = await createSession({
        assignmentId: assignment.id,
        studentId,
        assignmentItemId: item.id,
        durationSeconds: elapsedSeconds,
        practicedAt: new Date().toISOString(),
        note: note.trim() || undefined,
      }).unwrap();
      setMessage(
        `Practice recorded for ${result.practiceLocalDate}. Today fills at most one target.`,
      );
      setElapsedSeconds(0);
      setNote('');
    } catch {
      setMessage(
        'The session could not be saved. Your elapsed time is preserved; try again.',
      );
    }
  }

  async function toggleCompletion() {
    setMessage(null);
    try {
      const request = {
        itemId: item.id,
        assignmentId: assignment.id,
        studentId,
      };
      if (completed) await reopenItem(request).unwrap();
      else await completeItem(request).unwrap();
      setMessage(completed ? 'Task reopened.' : 'Task completed.');
    } catch {
      setMessage('The task could not be updated. Try again.');
    }
  }

  return (
    <article className="item-workspace">
      <header>
        <div>
          <p className="eyebrow">
            {item.completionMode === 'one_time'
              ? 'One-time task'
              : 'Practice item'}
          </p>
          <h2>{item.title}</h2>
        </div>
        {item.dueAt && (
          <span className="due-date">Due {formatDate(item.dueAt)}</span>
        )}
      </header>

      {item.instructions && (
        <div className="item-instructions">
          <ReactMarkdown
            components={{
              a: ({ children, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {item.instructions}
          </ReactMarkdown>
        </div>
      )}

      {item.resources.length > 0 ? (
        <section
          className="resource-workspace"
          aria-labelledby="resource-title"
        >
          <div
            className="resource-tabs"
            role="tablist"
            aria-label="Practice resources"
          >
            {item.resources.map((resource) => (
              <button
                key={resource.id}
                type="button"
                role="tab"
                aria-selected={resource.id === selectedResource?.id}
                onClick={() => setResourceId(resource.id)}
              >
                {resource.displayName}
              </button>
            ))}
          </div>
          <div id="resource-title" className="resource-viewer">
            {selectedResource && <ResourceViewer resource={selectedResource} />}
          </div>
        </section>
      ) : (
        <div className="resource-state">
          No resource is attached. Use the instructions and practice tools
          below.
        </div>
      )}

      {item.completionMode === 'practice_days' ? (
        <section
          className="practice-tools"
          aria-label="Practice timer and metronome"
        >
          <Metronome />
          <div className="session-timer">
            <span className="tool-label">Elapsed practice</span>
            <strong aria-live="off">{formatDuration(elapsedSeconds)}</strong>
            <div className="button-row">
              <button
                type="button"
                className="tool-button"
                onClick={() => setRunning((value) => !value)}
              >
                {running ? 'Pause' : elapsedSeconds ? 'Resume' : 'Start timer'}
              </button>
              <button
                type="button"
                className="tool-button"
                disabled={running || elapsedSeconds === 0}
                onClick={() => setElapsedSeconds(0)}
              >
                Reset
              </button>
            </div>
          </div>
          <label className="practice-note">
            Practice note <span>(optional)</span>
            <textarea
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="finish-button"
            disabled={createState.isLoading || elapsedSeconds === 0}
            onClick={() => void finishSession()}
          >
            {createState.isLoading
              ? 'Saving practice…'
              : 'Finish and save practice'}
          </button>
        </section>
      ) : (
        <section className="one-time-action">
          <div>
            <strong>{completed ? 'Completed' : 'Ready to complete'}</strong>
            <p>This task does not require the practice timer.</p>
          </div>
          <button
            type="button"
            className={completed ? 'secondary-button' : 'primary-link'}
            disabled={completeState.isLoading || reopenState.isLoading}
            onClick={() => void toggleCompletion()}
          >
            {completed ? 'Reopen task' : 'Mark complete'}
          </button>
        </section>
      )}
      {message && (
        <p className="practice-message" role="status">
          {message}
        </p>
      )}
    </article>
  );
}

function PracticeMessage({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="dashboard-message">
      <p className="eyebrow">Practice room</p>
      <h1>{title}</h1>
      <p>{detail}</p>
      <Link className="primary-link" to="../assignments/new" relative="path">
        Create assignment
      </Link>
    </section>
  );
}

function selectAssignment(
  assignments: StudentAssignment[],
  studentId: string,
  requestedId: string | null,
  timeZone?: string,
): StudentAssignment | undefined {
  const owned = assignments.filter(
    (assignment) =>
      assignment.studentId === studentId &&
      assignment.status !== 'cancelled' &&
      assignment.status !== 'archived',
  );
  if (requestedId)
    return owned.find((assignment) => assignment.id === requestedId);
  const today = localDateInTimeZone(new Date(), timeZone ?? 'UTC');
  return owned.find(
    (assignment) =>
      assignment.startDate <= today && assignment.endDate >= today,
  );
}

function localDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}
function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
function formatDateRange(start: string, end: string): string {
  return `${formatDate(`${start}T12:00:00`)} – ${formatDate(`${end}T12:00:00`)}`;
}
