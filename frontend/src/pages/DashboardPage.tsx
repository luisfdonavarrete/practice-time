export function DashboardPage() {
  return (
    <section className="page" aria-labelledby="dashboard-title">
      <p className="eyebrow">Weekly practice</p>
      <h1 id="dashboard-title">Make every practice day count.</h1>
      <p className="page-intro">
        Select a student to see assignments, resources, streaks, and
        achievements in one place.
      </p>
      <div className="empty-card">
        <h2>Choose a student to begin</h2>
        <p>Your owned student profiles will appear here after you sign in.</p>
      </div>
    </section>
  );
}
