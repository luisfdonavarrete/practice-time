import { Provider } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { store } from './store';
import { AppShell } from '../components/AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { LoginPage } from '../pages/LoginPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { SessionBoundary } from '../features/auth/SessionBoundary';
import type { AppStore } from './store';
import { AssignmentAuthoringPage } from '../pages/AssignmentAuthoringPage';
import { PracticePlayerPage } from '../pages/PracticePlayerPage';

interface AppProps {
  appStore?: AppStore;
}

export function App({ appStore = store }: AppProps) {
  return (
    <Provider store={appStore}>
      <BrowserRouter>
        <SessionBoundary>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route
                  path="students"
                  element={<PlaceholderPage title="Students" />}
                />
                <Route path="practice" element={<PracticePlayerPage />} />
                <Route
                  path="progress"
                  element={<PlaceholderPage title="Progress" />}
                />
                <Route
                  path="students/new"
                  element={<PlaceholderPage title="Add student" />}
                />
                <Route
                  path="assignments/new"
                  element={<AssignmentAuthoringPage mode="create" />}
                />
                <Route
                  path="assignments/:assignmentId/duplicate"
                  element={<AssignmentAuthoringPage mode="duplicate" />}
                />
                <Route
                  path="assignments/:assignmentId/edit"
                  element={<AssignmentAuthoringPage mode="edit" />}
                />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionBoundary>
      </BrowserRouter>
    </Provider>
  );
}
