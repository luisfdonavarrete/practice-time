import { useEffect, type ReactNode } from 'react';
import { api } from '../../app/api';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { authStorage } from './auth-storage';
import { loggedOut, sessionRestored } from './auth.slice';
import { useGetCurrentUserQuery } from './auth.api';

interface SessionBoundaryProps {
  children: ReactNode;
}

export function SessionBoundary({ children }: SessionBoundaryProps) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { data, isError, isLoading } = useGetCurrentUserQuery(undefined, {
    skip: !accessToken,
  });

  useEffect(() => {
    if (data) dispatch(sessionRestored(data));
  }, [data, dispatch]);

  useEffect(() => {
    if (!isError) return;
    authStorage.clear();
    dispatch(loggedOut());
    dispatch(api.util.resetApiState());
  }, [dispatch, isError]);

  if (accessToken && (isLoading || (!isError && !currentUser))) {
    return (
      <main className="session-loading" aria-live="polite">
        <span className="loading-note" aria-hidden="true">
          ♪
        </span>
        <p>Restoring your practice session…</p>
      </main>
    );
  }

  return children;
}
