import { NavLink, Outlet } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { useLogout } from '../features/auth/use-logout';
import { StudentSelector } from './StudentSelector';
import { UploadStatus } from './UploadStatus';

const navigation = [
  { to: '/', label: 'This week', end: true },
  { to: '/students', label: 'Students', end: false },
  { to: '/practice', label: 'Practice', end: false },
  { to: '/progress', label: 'Progress', end: false },
] as const;

export function AppShell() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const logout = useLogout();

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="brand" to="/" aria-label="Practice Time home">
          <span className="brand-mark" aria-hidden="true">
            ♪
          </span>
          <span>Practice Time</span>
        </NavLink>
        <StudentSelector />
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
