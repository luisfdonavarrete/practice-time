import { Provider } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { store } from './store';
import { AppShell } from '../components/AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { SessionBoundary } from '../features/auth/SessionBoundary';
import type { AppStore } from './store';
import { AssignmentAuthoringPage } from '../pages/AssignmentAuthoringPage';
import { PracticePlayerPage } from '../pages/PracticePlayerPage';
import { StudentsPage } from '../pages/StudentsPage';
import { useAppSelector } from './hooks';
import { useGetStudentsQuery } from '../features/students/students.api';

interface AppProps {
  appStore?: AppStore;
}

function StudentLanding() {
  const selectedStudentId = useAppSelector(
    (state) => state.studentContext.selectedStudentId,
  );
  const students = useGetStudentsQuery();
  if (students.isLoading) {
    return <main className="authoring-loading">Opening Practice Time…</main>;
  }
  const destination = students.data?.data.some(
    (student) => student.id === selectedStudentId,
  )
    ? `/students/${selectedStudentId}`
    : '/students';
  return <Navigate to={destination} replace />;
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
                <Route index element={<StudentLanding />} />
                <Route path="students" element={<StudentsPage />} />
                <Route
                  path="students/new"
                  element={<StudentsPage initialCreate />}
                />
                <Route path="students/:studentId" element={<DashboardPage />} />
                <Route
                  path="students/:studentId/practice"
                  element={<PracticePlayerPage />}
                />
                <Route
                  path="students/:studentId/assignments/new"
                  element={<AssignmentAuthoringPage mode="create" />}
                />
                <Route
                  path="students/:studentId/assignments/:assignmentId/duplicate"
                  element={<AssignmentAuthoringPage mode="duplicate" />}
                />
                <Route
                  path="students/:studentId/assignments/:assignmentId/edit"
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
