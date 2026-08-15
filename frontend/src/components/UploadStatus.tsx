import { useAppDispatch, useAppSelector } from '../app/hooks';
import { uploadStatusCleared } from '../features/uploads/upload-status.slice';

export function UploadStatus() {
  const dispatch = useAppDispatch();
  const upload = useAppSelector((state) => state.uploadStatus);

  if (upload.status === 'idle') return null;

  return (
    <aside className={`upload-status ${upload.status}`} aria-live="polite">
      <div>
        <strong>
          {upload.status === 'uploading' && `Uploading ${upload.fileName}`}
          {upload.status === 'succeeded' && `${upload.fileName} uploaded`}
          {upload.status === 'failed' && `${upload.fileName} needs attention`}
        </strong>
        {upload.status === 'uploading' && (
          <progress value={upload.progress} max="100">
            {upload.progress}%
          </progress>
        )}
        {upload.status === 'failed' && <span>{upload.message}</span>}
      </div>
      {upload.status !== 'uploading' && (
        <button type="button" onClick={() => dispatch(uploadStatusCleared())}>
          Dismiss
        </button>
      )}
    </aside>
  );
}
