import type { ReactNode } from 'react';
import type { AssignmentResource } from '../features/assignments/assignments.types';
import { useGetResourceAccessQuery } from '../features/assignments/assignments.api';

export function ResourceViewer({ resource }: { resource: AssignmentResource }) {
  const access = useGetResourceAccessQuery(resource.id, {
    skip: resource.kind !== 'upload',
    refetchOnMountOrArgChange: true,
  });

  if (resource.kind === 'external_link') {
    return <ExternalResource resource={resource} />;
  }
  if (resource.kind === 'youtube') {
    const embedUrl = youtubeEmbedUrl(resource.url);
    return embedUrl ? (
      <div className="resource-frame video-frame">
        <iframe
          src={embedUrl}
          title={resource.displayName}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    ) : (
      <UnsupportedResource resource={resource} />
    );
  }
  if (access.isLoading)
    return <ResourceState>Preparing secure resource…</ResourceState>;
  if (access.isError || !access.data) {
    return (
      <ResourceState>
        This secure link expired or could not be loaded.
        <button type="button" onClick={() => void access.refetch()}>
          Request a new link
        </button>
      </ResourceState>
    );
  }
  const url = access.data.url;
  if (resource.mimeType === 'application/pdf') {
    return (
      <iframe className="pdf-viewer" src={url} title={resource.displayName} />
    );
  }
  if (resource.mimeType?.startsWith('audio/')) {
    return (
      <audio className="audio-player" controls src={url}>
        Your browser cannot play this audio.
      </audio>
    );
  }
  if (resource.mimeType?.startsWith('image/')) {
    return (
      <img className="image-resource" src={url} alt={resource.displayName} />
    );
  }
  return (
    <ResourceState>
      This file cannot be previewed here.
      <a href={url} target="_blank" rel="noopener noreferrer">
        Open resource safely
      </a>
    </ResourceState>
  );
}

function ExternalResource({ resource }: { resource: AssignmentResource }) {
  return (
    <div className="external-resource">
      <span aria-hidden="true">↗</span>
      <div>
        <strong>{resource.displayName}</strong>
        <p>This resource opens in a separate browser tab.</p>
      </div>
      <a href={resource.url ?? '#'} target="_blank" rel="noopener noreferrer">
        Open link
      </a>
    </div>
  );
}

function UnsupportedResource({ resource }: { resource: AssignmentResource }) {
  return (
    <ResourceState>
      This resource format is not supported in the player.
      {resource.url && (
        <a href={resource.url} target="_blank" rel="noopener noreferrer">
          Open safely
        </a>
      )}
    </ResourceState>
  );
}

function ResourceState({ children }: { children: ReactNode }) {
  return (
    <div className="resource-state" role="status">
      {children}
    </div>
  );
}

function youtubeEmbedUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const id =
      url.hostname === 'youtu.be'
        ? url.pathname.slice(1)
        : url.searchParams.get('v');
    return id
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
      : null;
  } catch {
    return null;
  }
}
