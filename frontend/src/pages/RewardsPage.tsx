import { Link, useParams } from 'react-router-dom';
import { useGetAchievementsQuery } from '../features/assignments/assignments.api';
import { useGetStudentsQuery } from '../features/students/students.api';

export function RewardsPage() {
  const { studentId = '' } = useParams();
  const students = useGetStudentsQuery();
  const student = students.data?.data.find(({ id }) => id === studentId);
  const achievements = useGetAchievementsQuery(studentId, {
    skip: !studentId,
  });

  if (students.isLoading || achievements.isLoading) {
    return <main className="authoring-loading">Gathering rewards…</main>;
  }
  if (!student) {
    return (
      <section className="dashboard-message">
        <p className="eyebrow">Student unavailable</p>
        <h1>Choose a student to view rewards.</h1>
        <Link className="primary-link" to="/students">
          Choose student
        </Link>
      </section>
    );
  }

  const unlocked = achievements.data ?? [];
  return (
    <section className="rewards-page" aria-labelledby="rewards-page-title">
      <header className="page-heading">
        <div>
          <p className="eyebrow">{student.firstName}’s collection</p>
          <h1 id="rewards-page-title">Rewards</h1>
          <p>
            Practice consistently and complete assignments to unlock badges.
          </p>
        </div>
        <div
          className="reward-total"
          aria-label={`${unlocked.length} rewards unlocked`}
        >
          <span aria-hidden="true">★</span>
          <strong>{unlocked.length}</strong>
          <small>Unlocked</small>
        </div>
      </header>

      {achievements.isError && (
        <div className="form-alert" role="alert">
          Rewards could not be refreshed. Try again when the connection returns.
        </div>
      )}
      {!achievements.isError && unlocked.length === 0 && (
        <div className="rewards-empty">
          <span aria-hidden="true">☆</span>
          <h2>The first badge is close.</h2>
          <p>Finish a first practice session to begin the collection.</p>
          <Link className="primary-link" to={`/students/${studentId}/practice`}>
            Start practicing
          </Link>
        </div>
      )}
      <div className="reward-grid">
        {[...unlocked]
          .sort((left, right) =>
            right.unlockedAt.localeCompare(left.unlockedAt),
          )
          .map((achievement) => (
            <article className="reward-badge" key={achievement.id}>
              <span className="reward-badge-icon" aria-hidden="true">
                ★
              </span>
              <div>
                <p className="eyebrow">
                  Unlocked {formatDate(achievement.unlockedAt)}
                </p>
                <h2>{achievement.title}</h2>
                <p>{achievement.description}</p>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}
