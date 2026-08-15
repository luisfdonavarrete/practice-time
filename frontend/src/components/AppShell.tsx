import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
  { to: '/', label: 'This week', end: true },
  { to: '/students', label: 'Students', end: false },
  { to: '/practice', label: 'Practice', end: false },
  { to: '/progress', label: 'Progress', end: false },
] as const;

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="brand" to="/" aria-label="Practice Time home">
          <span className="brand-mark" aria-hidden="true">
            ♪
          </span>
          <span>Practice Time</span>
        </NavLink>
        <span className="student-context">No student selected</span>
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
    </div>
  );
}
