import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { useLogout } from '../features/auth/use-logout';
import { UploadStatus } from './UploadStatus';
import { useGetStudentsQuery } from '../features/students/students.api';

export function AppShell() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const rememberedStudentId = useAppSelector(
    (state) => state.studentContext.selectedStudentId,
  );
  const logout = useLogout();
  const { studentId } = useParams();
  const students = useGetStudentsQuery();
  const activeStudentId = studentId ?? rememberedStudentId ?? undefined;
  const student = students.data?.data.find(({ id }) => id === activeStudentId);
  const navigation = student
      ? [
        { to: `/students/${student.id}`, label: 'This week', end: true },
        {
          to: `/students/${student.id}/rewards`,
          label: 'Rewards',
          end: false,
        },
      ]
    : [{ to: '/students', label: 'Students', end: true }];

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink
          className="brand"
          to={student ? `/students/${student.id}` : '/students'}
          aria-label="Practice Time home"
        >
          <span className="brand-mark" aria-hidden="true">
            ♪
          </span>
          <span>Practice Time</span>
        </NavLink>
        {student && (
          <div className="active-student">
            <span>
              Practicing with <strong>{student.firstName}</strong>
            </span>
            <NavLink to="/students">Change</NavLink>
          </div>
        )}
        <div className="account-menu">
          <span>{currentUser?.firstName}</span>
          <button type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <aside className="app-sidebar" aria-label="Primary navigation">
        <nav>
          {navigation.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="app-content" id="main-content">
        <Outlet />
      </main>
      <UploadStatus />
    </div>
  );
}
