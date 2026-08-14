import { AchievementKey } from './entities/student-achievement.entity';
import { evaluateAchievementRules } from './achievement.rules';

describe('achievement rules', () => {
  it.each([
    [{ hasPractice: true }, AchievementKey.FIRST_PRACTICE],
    [{ hasSixtyMinuteWeek: true }, AchievementKey.WEEKLY_60_MINUTES],
    [{ currentStreak: 3 }, AchievementKey.THREE_DAY_STREAK],
    [{ currentStreak: 7 }, AchievementKey.SEVEN_DAY_STREAK],
    [
      { hasCompletedAssignment: true },
      AchievementKey.FIRST_ASSIGNMENT_COMPLETE,
    ],
  ])('unlocks the matching achievement for %o', (change, expected) => {
    const facts = {
      hasPractice: false,
      hasSixtyMinuteWeek: false,
      currentStreak: 0,
      hasCompletedAssignment: false,
      ...change,
    };
    expect(evaluateAchievementRules(facts).map((rule) => rule.key)).toContain(
      expected,
    );
  });

  it('does not unlock a streak before its threshold', () => {
    expect(
      evaluateAchievementRules({
        hasPractice: false,
        hasSixtyMinuteWeek: false,
        currentStreak: 2,
        hasCompletedAssignment: false,
      }),
    ).toEqual([]);
  });
});
