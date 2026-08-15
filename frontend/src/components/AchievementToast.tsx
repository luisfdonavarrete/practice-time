import type { AchievementUnlock } from '../features/achievements/use-achievement-socket';

export function AchievementToast({
  achievement,
  onDismiss,
}: {
  achievement: AchievementUnlock;
  onDismiss: () => void;
}) {
  return (
    <aside className="achievement-toast" aria-live="polite" aria-atomic="true">
      <span aria-hidden="true">★</span>
      <div>
        <strong>{achievement.title}</strong>
        <p>{achievement.description}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss achievement"
      >
        ×
      </button>
    </aside>
  );
}
