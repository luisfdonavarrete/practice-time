import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { environment } from '../config/env';
import {
  useCreateAssignmentMutation,
  useGetAssignmentQuery,
  usePublishAssignmentMutation,
  useUpdateAssignmentMutation,
} from '../features/assignments/assignments.api';
import type {
  CreateStudentAssignment,
  StudentAssignment,
  UpdateStudentAssignment,
} from '../features/assignments/assignments.types';
import { authStorage } from '../features/auth/auth-storage';
import { isFetchBaseQueryError } from '../features/auth/is-fetch-base-query-error';
import { useGetStudentsQuery } from '../features/students/students.api';
import {
  uploadFailed,
  uploadProgressed,
  uploadStarted,
  uploadStatusCleared,
  uploadSucceeded,
} from '../features/uploads/upload-status.slice';

type ResourceKind = 'external_link' | 'youtube' | 'upload';

interface ResourceDraft {
  localId: string;
  existingId?: string;
  kind: ResourceKind;
  displayName: string;
  url: string;
  file: File | null;
  originalFilename?: string;
}

interface ItemDraft {
  localId: string;
  title: string;
  instructions: string;
  completionMode: 'practice_days' | 'one_time';
  suggestedPracticeDays: number;
  dueAt: string;
  resources: ResourceDraft[];
}

interface SectionDraft {
  localId: string;
  title: string;
  items: ItemDraft[];
}

interface NoticeDraft {
  localId: string;
  title: string;
  occursAt: string;
  location: string;
  details: string;
}

interface AssignmentDraft {
  studentId: string;
  title: string;
  description: string;
  startDate: string;
  notices: NoticeDraft[];
  sections: SectionDraft[];
}

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ACCEPTED_UPLOAD_TYPES = [
  'application/pdf',
  'audio/mpeg',
  'image/jpeg',
  'image/png',
  'image/webp',
];

type AuthoringMode = 'create' | 'duplicate' | 'edit';

export function AssignmentAuthoringPage({
  mode = 'create',
}: {
  mode?: AuthoringMode;
}) {
  const { assignmentId } = useParams();
  const sourceQuery = useGetAssignmentQuery(assignmentId ?? '', {
    skip: mode === 'create' || !assignmentId,
  });

  if (sourceQuery.isLoading) {
    return (
      <main className="authoring-loading">
        {mode === 'edit'
          ? 'Opening assignment draft…'
          : 'Preparing a clean copy…'}
      </main>
    );
  }

  if (sourceQuery.isError) {
    return (
      <section className="dashboard-message">
        <p className="eyebrow">Assignment unavailable</p>
        <h1>
          This assignment could not be{' '}
          {mode === 'edit' ? 'edited' : 'duplicated'}.
        </h1>
        <p>The assignment may no longer be available to this account.</p>
        <Link className="secondary-link" to="/">
          Return to dashboard
        </Link>
      </section>
    );
  }

  if (mode === 'edit' && sourceQuery.data?.status !== 'draft') {
    return (
      <section className="dashboard-message">
        <p className="eyebrow">Published assignment</p>
        <h1>Only drafts can be edited.</h1>
        <p>Duplicate this assignment to make a new editable practice week.</p>
        <Link className="secondary-link" to="/">
          Return to dashboard
        </Link>
      </section>
    );
  }

  return (
    <AssignmentAuthoringForm
      key={assignmentId ?? 'new-assignment'}
      assignmentId={assignmentId}
      source={sourceQuery.data}
      mode={mode}
    />
  );
}

function AssignmentAuthoringForm({
  assignmentId,
  source,
  mode,
}: {
  assignmentId?: string;
  source?: StudentAssignment;
  mode: AuthoringMode;
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedStudentId = useAppSelector(
    (state) => state.studentContext.selectedStudentId,
  );
  const studentsQuery = useGetStudentsQuery();
  const [createAssignment, createState] = useCreateAssignmentMutation();
  const [updateAssignment, updateState] = useUpdateAssignmentMutation();
  const [publishAssignment, publishState] = usePublishAssignmentMutation();
  const [draft, setDraft] = useState<AssignmentDraft>(() =>
    source
      ? mode === 'edit'
        ? editDraft(source)
        : duplicateDraft(source)
      : emptyDraft(selectedStudentId ?? ''),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAssignment, setSavedAssignment] =
    useState<StudentAssignment | null>(null);
  const [pendingPublish, setPendingPublish] = useState(false);
  const uploadedResourceIds = useRef(new Set<string>());

  const endDate = useMemo(
    () => (draft.startDate ? addDays(draft.startDate, 6) : ''),
    [draft.startDate],
  );

  async function save(publish: boolean) {
    const validationErrors = validateDraft(draft);
    setErrors(validationErrors);
    setSaveError(null);
    if (validationErrors.length > 0) return;

    setPendingPublish(publish);
    try {
      const saved =
        mode === 'edit' && assignmentId
          ? await updateAssignment({
              assignmentId,
              assignment: toUpdateRequest(draft),
            }).unwrap()
          : await createAssignment(toCreateRequest(draft)).unwrap();
      setSavedAssignment(saved);
      await uploadDraftFiles(
        draft,
        saved,
        dispatch,
        uploadedResourceIds.current,
      );
      if (publish) await publishAssignment(saved.id).unwrap();
      dispatch(uploadStatusCleared());
      navigate('/', { replace: true });
    } catch (error) {
      setSaveError(authoringErrorMessage(error));
    }
  }

  async function retryUploads() {
    if (!savedAssignment) return;
    setSaveError(null);
    try {
      await uploadDraftFiles(
        draft,
        savedAssignment,
        dispatch,
        uploadedResourceIds.current,
      );
      if (pendingPublish) await publishAssignment(savedAssignment.id).unwrap();
      dispatch(uploadStatusCleared());
      navigate('/', { replace: true });
    } catch (error) {
      setSaveError(authoringErrorMessage(error));
    }
  }

  const busy =
    createState.isLoading || updateState.isLoading || publishState.isLoading;

  return (
    <section className="authoring-page" aria-labelledby="authoring-title">
      <header className="authoring-heading">
        <div>
          <p className="eyebrow">
            {mode === 'edit'
              ? 'Edit draft'
              : mode === 'duplicate'
                ? 'Duplicate week'
                : 'Assignment builder'}
          </p>
          <h1 id="authoring-title">
            {mode === 'edit'
              ? 'Refine this practice week.'
              : mode === 'duplicate'
                ? 'Shape the next practice week.'
                : 'Plan a focused practice week.'}
          </h1>
          <p>
            Draft changes stay on this page until the complete assignment is
            saved. A week always contains seven local calendar days.
          </p>
        </div>
        <Link className="text-link" to="/">
          Cancel
        </Link>
      </header>

      {mode === 'duplicate' && (
        <div className="authoring-note" role="note">
          Content and link resources were copied. Practice sessions,
          completions, achievements, and uploaded files were intentionally
          reset.
        </div>
      )}

      {errors.length > 0 && (
        <div className="form-alert" role="alert">
          <strong>Review the assignment before saving:</strong>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {saveError && (
        <div className="form-alert" role="alert">
          {saveError}
          {savedAssignment && (
            <button
              type="button"
              className="retry-button"
              onClick={() => void retryUploads()}
            >
              Retry remaining uploads
            </button>
          )}
        </div>
      )}

      <div className="authoring-layout">
        <main className="authoring-form">
          <section className="form-card" aria-labelledby="week-details-title">
            <h2 id="week-details-title">Week details</h2>
            <div className="form-grid">
              <label>
                Student
                <select
                  value={draft.studentId}
                  disabled={mode !== 'create'}
                  onChange={(event) =>
                    setDraft({ ...draft, studentId: event.target.value })
                  }
                >
                  <option value="">Choose a student</option>
                  {studentsQuery.data?.data.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Week starts
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(event) =>
                    setDraft({ ...draft, startDate: event.target.value })
                  }
                />
              </label>
              <label>
                Week ends
                <input
                  type="date"
                  value={endDate}
                  readOnly
                  aria-describedby="week-range-help"
                />
              </label>
              <label className="wide-field">
                Assignment title
                <input
                  value={draft.title}
                  maxLength={255}
                  onChange={(event) =>
                    setDraft({ ...draft, title: event.target.value })
                  }
                />
              </label>
              <label className="wide-field">
                Description <span>(optional)</span>
                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                />
              </label>
            </div>
            <p id="week-range-help" className="field-help">
              {draft.startDate
                ? `${formatDate(draft.startDate)} through ${formatDate(endDate)}`
                : 'Choose the student’s local start date.'}
            </p>
          </section>

          <NoticeEditor
            notices={draft.notices}
            onChange={(notices) => setDraft({ ...draft, notices })}
          />

          <section className="form-card" aria-labelledby="sections-title">
            <div className="form-section-heading">
              <div>
                <p className="eyebrow">Practice plan</p>
                <h2 id="sections-title">Areas and assignments</h2>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    sections: [...draft.sections, newSection()],
                  })
                }
              >
                Add area
              </button>
            </div>
            <div className="section-editor-list">
              {draft.sections.map((section, sectionIndex) => (
                <SectionEditor
                  key={section.localId}
                  section={section}
                  index={sectionIndex}
                  count={draft.sections.length}
                  onChange={(next) =>
                    setDraft({
                      ...draft,
                      sections: replaceAt(draft.sections, sectionIndex, next),
                    })
                  }
                  onMove={(direction) =>
                    setDraft({
                      ...draft,
                      sections: move(draft.sections, sectionIndex, direction),
                    })
                  }
                  onRemove={() =>
                    setDraft({
                      ...draft,
                      sections: draft.sections.filter(
                        (_, index) => index !== sectionIndex,
                      ),
                    })
                  }
                />
              ))}
            </div>
          </section>
        </main>

        <aside className="authoring-summary">
          <p className="eyebrow">Ready when you are</p>
          <h2>{draft.title.trim() || 'Untitled practice week'}</h2>
          <dl>
            <div>
              <dt>Areas</dt>
              <dd>{draft.sections.length}</dd>
            </div>
            <div>
              <dt>Items</dt>
              <dd>
                {draft.sections.reduce(
                  (sum, section) => sum + section.items.length,
                  0,
                )}
              </dd>
            </div>
            <div>
              <dt>Notices</dt>
              <dd>{draft.notices.length}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="secondary-button action-button"
            disabled={busy || Boolean(savedAssignment)}
            onClick={() => void save(false)}
          >
            {(createState.isLoading || updateState.isLoading) && !pendingPublish
              ? 'Saving…'
              : 'Save draft'}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={busy || Boolean(savedAssignment)}
            onClick={() => void save(true)}
          >
            {busy && pendingPublish ? 'Publishing…' : 'Publish week'}
          </button>
          <p className="field-help">
            Publishing happens only after every selected upload succeeds.
          </p>
        </aside>
      </div>
    </section>
  );
}

function NoticeEditor({
  notices,
  onChange,
}: {
  notices: NoticeDraft[];
  onChange: (notices: NoticeDraft[]) => void;
}) {
  return (
    <section className="form-card" aria-labelledby="notices-editor-title">
      <div className="form-section-heading">
        <div>
          <p className="eyebrow">Dates and reminders</p>
          <h2 id="notices-editor-title">Notices</h2>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onChange([...notices, newNotice()])}
        >
          Add notice
        </button>
      </div>
      {notices.length === 0 && (
        <p className="field-help">
          Add recital dates, class-room changes, tests, or other reminders.
        </p>
      )}
      {notices.map((notice, index) => (
        <fieldset className="nested-editor" key={notice.localId}>
          <legend>Notice {index + 1}</legend>
          <div className="editor-actions">
            <MoveButtons
              index={index}
              count={notices.length}
              onMove={(direction) => onChange(move(notices, index, direction))}
            />
            <button
              type="button"
              className="danger-link"
              onClick={() =>
                onChange(notices.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              Remove
            </button>
          </div>
          <div className="form-grid">
            <label>
              Title
              <input
                value={notice.title}
                onChange={(event) =>
                  onChange(
                    replaceAt(notices, index, {
                      ...notice,
                      title: event.target.value,
                    }),
                  )
                }
              />
            </label>
            <label>
              Date and time <span>(optional)</span>
              <input
                type="datetime-local"
                value={notice.occursAt}
                onChange={(event) =>
                  onChange(
                    replaceAt(notices, index, {
                      ...notice,
                      occursAt: event.target.value,
                    }),
                  )
                }
              />
            </label>
            <label>
              Location <span>(optional)</span>
              <input
                value={notice.location}
                onChange={(event) =>
                  onChange(
                    replaceAt(notices, index, {
                      ...notice,
                      location: event.target.value,
                    }),
                  )
                }
              />
            </label>
            <label className="wide-field">
              Details <span>(optional)</span>
              <textarea
                rows={2}
                value={notice.details}
                onChange={(event) =>
                  onChange(
                    replaceAt(notices, index, {
                      ...notice,
                      details: event.target.value,
                    }),
                  )
                }
              />
            </label>
          </div>
        </fieldset>
      ))}
    </section>
  );
}

function SectionEditor({
  section,
  index,
  count,
  onChange,
  onMove,
  onRemove,
}: {
  section: SectionDraft;
  index: number;
  count: number;
  onChange: (section: SectionDraft) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <fieldset className="nested-editor section-editor">
      <legend>Area {index + 1}</legend>
      <div className="editor-actions">
        <MoveButtons index={index} count={count} onMove={onMove} />
        <button type="button" className="danger-link" onClick={onRemove}>
          Remove area
        </button>
      </div>
      <label>
        Area title
        <input
          value={section.title}
          placeholder="Repertoire"
          onChange={(event) =>
            onChange({ ...section, title: event.target.value })
          }
        />
      </label>
      <div className="item-editor-list">
        {section.items.map((item, itemIndex) => (
          <ItemEditor
            key={item.localId}
            item={item}
            index={itemIndex}
            count={section.items.length}
            onChange={(next) =>
              onChange({
                ...section,
                items: replaceAt(section.items, itemIndex, next),
              })
            }
            onMove={(direction) =>
              onChange({
                ...section,
                items: move(section.items, itemIndex, direction),
              })
            }
            onRemove={() =>
              onChange({
                ...section,
                items: section.items.filter(
                  (_, position) => position !== itemIndex,
                ),
              })
            }
          />
        ))}
      </div>
      <button
        type="button"
        className="add-item-button"
        onClick={() =>
          onChange({ ...section, items: [...section.items, newItem()] })
        }
      >
        + Add assignment item
      </button>
    </fieldset>
  );
}

function ItemEditor({
  item,
  index,
  count,
  onChange,
  onMove,
  onRemove,
}: {
  item: ItemDraft;
  index: number;
  count: number;
  onChange: (item: ItemDraft) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <fieldset className="nested-editor item-editor">
      <legend>Item {index + 1}</legend>
      <div className="editor-actions">
        <MoveButtons index={index} count={count} onMove={onMove} />
        <button type="button" className="danger-link" onClick={onRemove}>
          Remove item
        </button>
      </div>
      <div className="form-grid">
        <label className="wide-field">
          Title
          <input
            value={item.title}
            placeholder="Amazing Grace"
            onChange={(event) =>
              onChange({ ...item, title: event.target.value })
            }
          />
        </label>
        <label>
          Completion
          <select
            value={item.completionMode}
            onChange={(event) =>
              onChange({
                ...item,
                completionMode: event.target
                  .value as ItemDraft['completionMode'],
              })
            }
          >
            <option value="practice_days">Practice days</option>
            <option value="one_time">One-time task</option>
          </select>
        </label>
        {item.completionMode === 'practice_days' && (
          <label>
            Suggested days
            <input
              type="number"
              min="1"
              max="7"
              value={item.suggestedPracticeDays}
              onChange={(event) =>
                onChange({
                  ...item,
                  suggestedPracticeDays: Number(event.target.value),
                })
              }
            />
          </label>
        )}
        <label>
          Due date <span>(optional)</span>
          <input
            type="date"
            value={item.dueAt}
            onChange={(event) =>
              onChange({ ...item, dueAt: event.target.value })
            }
          />
        </label>
        <label className="wide-field">
          Instructions <span>(Markdown supported)</span>
          <textarea
            rows={4}
            value={item.instructions}
            onChange={(event) =>
              onChange({ ...item, instructions: event.target.value })
            }
          />
        </label>
      </div>
      <ResourceEditor
        resources={item.resources}
        onChange={(resources) => onChange({ ...item, resources })}
      />
    </fieldset>
  );
}

function ResourceEditor({
  resources,
  onChange,
}: {
  resources: ResourceDraft[];
  onChange: (resources: ResourceDraft[]) => void;
}) {
  return (
    <div className="resource-editor">
      <div className="resource-heading">
        <strong>Resources</strong>
        <div className="button-row">
          <button
            type="button"
            onClick={() => onChange([...resources, newResource('upload')])}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() =>
              onChange([...resources, newResource('external_link')])
            }
          >
            External link
          </button>
          <button
            type="button"
            onClick={() => onChange([...resources, newResource('youtube')])}
          >
            YouTube
          </button>
        </div>
      </div>
      {resources.map((resource, index) => (
        <div className="resource-row" key={resource.localId}>
          <span className="resource-kind">
            {resource.kind.replace('_', ' ')}
          </span>
          <input
            aria-label={`Resource ${index + 1} display name`}
            placeholder="Display name"
            value={resource.displayName}
            onChange={(event) =>
              onChange(
                replaceAt(resources, index, {
                  ...resource,
                  displayName: event.target.value,
                }),
              )
            }
          />
          {resource.kind === 'upload' ? (
            <div className="existing-upload">
              {resource.existingId && !resource.file && (
                <span>Current file: {resource.originalFilename}</span>
              )}
              <input
                aria-label={`Resource ${index + 1} file`}
                type="file"
                accept=".pdf,.mp3,.jpg,.jpeg,.png,.webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  onChange(
                    replaceAt(resources, index, {
                      ...resource,
                      existingId: file ? undefined : resource.existingId,
                      file,
                      displayName: resource.displayName || file?.name || '',
                    }),
                  );
                }}
              />
            </div>
          ) : (
            <input
              aria-label={`Resource ${index + 1} URL`}
              type="url"
              placeholder="https://…"
              value={resource.url}
              onChange={(event) =>
                onChange(
                  replaceAt(resources, index, {
                    ...resource,
                    url: event.target.value,
                  }),
                )
              }
            />
          )}
          <MoveButtons
            index={index}
            count={resources.length}
            onMove={(direction) => onChange(move(resources, index, direction))}
          />
          <button
            type="button"
            className="danger-link"
            onClick={() =>
              onChange(resources.filter((_, position) => position !== index))
            }
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function MoveButtons({
  index,
  count,
  onMove,
}: {
  index: number;
  count: number;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <span className="move-buttons">
      <button
        type="button"
        disabled={index === 0}
        aria-label="Move up"
        onClick={() => onMove(-1)}
      >
        ↑
      </button>
      <button
        type="button"
        disabled={index === count - 1}
        aria-label="Move down"
        onClick={() => onMove(1)}
      >
        ↓
      </button>
    </span>
  );
}

function emptyDraft(studentId: string): AssignmentDraft {
  const startDate = localDate(new Date());
  return {
    studentId,
    title: '',
    description: '',
    startDate,
    notices: [],
    sections: [newSection()],
  };
}

function duplicateDraft(source: StudentAssignment): AssignmentDraft {
  return {
    studentId: source.studentId,
    title: `${source.title} (copy)`,
    description: source.description ?? '',
    startDate: localDate(new Date()),
    notices: source.notices.map((notice) => ({
      localId: crypto.randomUUID(),
      title: notice.title,
      occursAt: '',
      location: notice.location ?? '',
      details: notice.details ?? '',
    })),
    sections: source.sections.map((section) => ({
      localId: crypto.randomUUID(),
      title: section.title,
      items: section.items.map((item) => ({
        localId: crypto.randomUUID(),
        title: item.title,
        instructions: item.instructions ?? '',
        completionMode: item.completionMode,
        suggestedPracticeDays: item.suggestedPracticeDays ?? 1,
        dueAt: '',
        resources: item.resources
          .filter((resource) => resource.kind !== 'upload')
          .map((resource) => ({
            localId: crypto.randomUUID(),
            kind: resource.kind as ResourceKind,
            displayName: resource.displayName,
            url: resource.url ?? '',
            file: null,
          })),
      })),
    })),
  };
}

function editDraft(source: StudentAssignment): AssignmentDraft {
  return {
    studentId: source.studentId,
    title: source.title,
    description: source.description ?? '',
    startDate: source.startDate,
    notices: source.notices.map((notice) => ({
      localId: notice.id,
      title: notice.title,
      occursAt: notice.occursAt ? toDateTimeLocal(notice.occursAt) : '',
      location: notice.location ?? '',
      details: notice.details ?? '',
    })),
    sections: source.sections.map((section) => ({
      localId: section.id,
      title: section.title,
      items: section.items.map((item) => ({
        localId: item.id,
        title: item.title,
        instructions: item.instructions ?? '',
        completionMode: item.completionMode,
        suggestedPracticeDays: item.suggestedPracticeDays ?? 1,
        dueAt: item.dueAt ? item.dueAt.slice(0, 10) : '',
        resources: item.resources.map((resource) => ({
          localId: resource.id,
          existingId: resource.kind === 'upload' ? resource.id : undefined,
          kind: resource.kind,
          displayName: resource.displayName,
          url: resource.url ?? '',
          file: null,
          originalFilename: resource.originalFilename ?? undefined,
        })),
      })),
    })),
  };
}

function newNotice(): NoticeDraft {
  return {
    localId: crypto.randomUUID(),
    title: '',
    occursAt: '',
    location: '',
    details: '',
  };
}
function newSection(): SectionDraft {
  return { localId: crypto.randomUUID(), title: '', items: [newItem()] };
}
function newItem(): ItemDraft {
  return {
    localId: crypto.randomUUID(),
    title: '',
    instructions: '',
    completionMode: 'practice_days',
    suggestedPracticeDays: 3,
    dueAt: '',
    resources: [],
  };
}
function newResource(kind: ResourceKind): ResourceDraft {
  return {
    localId: crypto.randomUUID(),
    kind,
    displayName: '',
    url: '',
    file: null,
  };
}

function validateDraft(draft: AssignmentDraft): string[] {
  const errors: string[] = [];
  if (!draft.studentId) errors.push('Choose an owned student.');
  if (!draft.title.trim()) errors.push('Enter an assignment title.');
  if (!draft.startDate) errors.push('Choose a local start date.');
  if (draft.sections.length === 0)
    errors.push('Add at least one practice area.');
  draft.notices.forEach((notice, index) => {
    if (!notice.title.trim()) errors.push(`Notice ${index + 1} needs a title.`);
  });
  draft.sections.forEach((section, sectionIndex) => {
    if (!section.title.trim())
      errors.push(`Area ${sectionIndex + 1} needs a title.`);
    if (section.items.length === 0)
      errors.push(`Area ${sectionIndex + 1} needs at least one item.`);
    section.items.forEach((item, itemIndex) => {
      const prefix = `Area ${sectionIndex + 1}, item ${itemIndex + 1}`;
      if (!item.title.trim()) errors.push(`${prefix} needs a title.`);
      if (
        item.completionMode === 'practice_days' &&
        (item.suggestedPracticeDays < 1 || item.suggestedPracticeDays > 7)
      )
        errors.push(`${prefix} practice target must be between 1 and 7 days.`);
      item.resources.forEach((resource, resourceIndex) => {
        if (!resource.displayName.trim())
          errors.push(
            `${prefix}, resource ${resourceIndex + 1} needs a display name.`,
          );
        if (resource.kind === 'upload') {
          if (!resource.file && !resource.existingId)
            errors.push(
              `${prefix}, resource ${resourceIndex + 1} needs a file.`,
            );
          else if (
            resource.file &&
            !ACCEPTED_UPLOAD_TYPES.includes(resource.file.type)
          )
            errors.push(
              `${resource.file.name} is not a supported PDF, MP3, or image.`,
            );
          else if (resource.file && resource.file.size > MAX_UPLOAD_BYTES)
            errors.push(`${resource.file.name} is larger than 15 MB.`);
        } else if (!isHttpsUrl(resource.url))
          errors.push(
            `${prefix}, resource ${resourceIndex + 1} needs a valid HTTPS URL.`,
          );
        if (resource.kind === 'youtube' && !isYouTubeUrl(resource.url))
          errors.push(
            `${prefix}, resource ${resourceIndex + 1} must use YouTube.`,
          );
      });
    });
  });
  return errors;
}

function toCreateRequest(draft: AssignmentDraft): CreateStudentAssignment {
  return {
    studentId: draft.studentId,
    title: draft.title.trim(),
    description: draft.description.trim() || undefined,
    startDate: draft.startDate,
    endDate: addDays(draft.startDate, 6),
    notices: draft.notices.map((notice, position) => ({
      title: notice.title.trim(),
      occursAt: notice.occursAt
        ? new Date(notice.occursAt).toISOString()
        : undefined,
      location: notice.location.trim() || undefined,
      details: notice.details.trim() || undefined,
      position,
    })),
    sections: draft.sections.map((section, position) => ({
      title: section.title.trim(),
      position,
      items: section.items.map((item, itemPosition) => ({
        title: item.title.trim(),
        instructions: item.instructions.trim() || undefined,
        completionMode: item.completionMode,
        suggestedPracticeDays:
          item.completionMode === 'practice_days'
            ? item.suggestedPracticeDays
            : undefined,
        dueAt: item.dueAt
          ? new Date(`${item.dueAt}T12:00:00`).toISOString()
          : undefined,
        position: itemPosition,
        resources: item.resources.flatMap((resource, resourcePosition) =>
          resource.kind === 'upload'
            ? []
            : [
                {
                  kind: resource.kind,
                  displayName: resource.displayName.trim(),
                  url: resource.url.trim(),
                  position: resourcePosition,
                },
              ],
        ),
      })),
    })),
  };
}

function toUpdateRequest(draft: AssignmentDraft): UpdateStudentAssignment {
  const request = toCreateRequest(draft);
  return {
    title: request.title,
    description: draft.description.trim(),
    startDate: request.startDate,
    endDate: request.endDate,
    notices: request.notices,
    sections: request.sections.map((section, sectionIndex) => ({
      ...section,
      items: section.items.map((item, itemIndex) => ({
        ...item,
        retainedUploads: draft.sections[sectionIndex].items[
          itemIndex
        ].resources.flatMap((resource, position) =>
          resource.kind === 'upload' && resource.existingId
            ? [
                {
                  id: resource.existingId,
                  displayName: resource.displayName.trim(),
                  position,
                },
              ]
            : [],
        ),
      })),
    })),
  };
}

async function uploadDraftFiles(
  draft: AssignmentDraft,
  saved: StudentAssignment,
  dispatch: ReturnType<typeof useAppDispatch>,
  uploadedResourceIds: Set<string>,
) {
  for (const [sectionPosition, section] of draft.sections.entries()) {
    for (const [itemPosition, item] of section.items.entries()) {
      const savedItem = saved.sections
        .find((candidate) => candidate.position === sectionPosition)
        ?.items.find((candidate) => candidate.position === itemPosition);
      if (!savedItem)
        throw new Error(
          'The saved assignment item could not be matched for upload.',
        );
      for (const [resourcePosition, resource] of item.resources.entries()) {
        if (
          resource.kind !== 'upload' ||
          !resource.file ||
          uploadedResourceIds.has(resource.localId)
        )
          continue;
        dispatch(uploadStarted({ fileName: resource.file.name }));
        try {
          await uploadResource(
            savedItem.id,
            resource,
            resourcePosition,
            (progress) => dispatch(uploadProgressed(progress)),
          );
          uploadedResourceIds.add(resource.localId);
          dispatch(uploadSucceeded({ fileName: resource.file.name }));
        } catch (error) {
          dispatch(
            uploadFailed({
              fileName: resource.file.name,
              message: 'Upload failed. Your assignment draft is preserved.',
            }),
          );
          throw error;
        }
      }
    }
  }
}

function uploadResource(
  itemId: string,
  resource: ResourceDraft,
  position: number,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(
      'POST',
      `${environment.apiBaseUrl}/student-assignment-items/${itemId}/resources/upload`,
    );
    const token = authStorage.read();
    if (token) request.setRequestHeader('Authorization', `Bearer ${token}`);
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener('load', () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error('Upload failed')),
    );
    request.addEventListener('error', () => reject(new Error('Upload failed')));
    const body = new FormData();
    body.set('displayName', resource.displayName.trim());
    body.set('position', String(position));
    body.set('file', resource.file!);
    request.send(body);
  });
}

function authoringErrorMessage(error: unknown): string {
  if (isFetchBaseQueryError(error)) {
    if (error.status === 404)
      return 'The selected student or assignment is no longer available.';
    if (error.status === 400)
      return 'The API rejected part of the assignment. Review the dates, targets, and resource details.';
    if (error.status === 'FETCH_ERROR')
      return 'The API could not be reached. Your form has been preserved.';
  }
  return error instanceof Error
    ? error.message
    : 'The assignment could not be saved. Your form has been preserved.';
}

function replaceAt<T>(items: T[], index: number, value: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}
function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
function localDate(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}
function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}
function isYouTubeUrl(value: string): boolean {
  try {
    return ['youtube.com', 'www.youtube.com', 'youtu.be'].includes(
      new URL(value).hostname.toLowerCase(),
    );
  } catch {
    return false;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export const assignmentDraftTestSupport = {
  addDays,
  duplicateDraft,
  editDraft,
  emptyDraft,
  toCreateRequest,
  toUpdateRequest,
  validateDraft,
};
