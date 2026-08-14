import { AchievementKey } from './entities/student-achievement.entity';

export interface AchievementFacts {
  hasPractice: boolean;
  hasSixtyMinuteWeek: boolean;
  currentStreak: number;
  hasCompletedAssignment: boolean;
}

export interface AchievementDefinition {
  key: AchievementKey;
  title: string;
  description: string;
  qualifies: (facts: AchievementFacts) => boolean;
}

export const ACHIEVEMENT_RULES: readonly AchievementDefinition[] = [
  {
    key: AchievementKey.FIRST_PRACTICE,
    title: 'First Note',
    description: 'Record the first practice session.',
    qualifies: (facts) => facts.hasPractice,
  },
  {
    key: AchievementKey.WEEKLY_60_MINUTES,
    title: 'One-Hour Hero',
    description: 'Practice for at least 60 minutes during an assignment week.',
    qualifies: (facts) => facts.hasSixtyMinuteWeek,
  },
  {
    key: AchievementKey.THREE_DAY_STREAK,
    title: 'Practice Spark',
    description: 'Build a three-day practice streak.',
    qualifies: (facts) => facts.currentStreak >= 3,
  },
  {
    key: AchievementKey.SEVEN_DAY_STREAK,
    title: 'Weekly Virtuoso',
    description: 'Build a seven-day practice streak.',
    qualifies: (facts) => facts.currentStreak >= 7,
  },
  {
    key: AchievementKey.FIRST_ASSIGNMENT_COMPLETE,
    title: 'Assignment Ace',
    description: 'Complete every item in a weekly assignment.',
    qualifies: (facts) => facts.hasCompletedAssignment,
  },
] as const;

export function evaluateAchievementRules(
  facts: AchievementFacts,
): AchievementDefinition[] {
  return ACHIEVEMENT_RULES.filter((rule) => rule.qualifies(facts));
}
