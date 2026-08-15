export type AssignmentStatus = 'draft' | 'published' | 'archived' | 'cancelled';

export interface AssignmentNotice {
  id: string;
  title: string;
  occursAt: string | null;
  location: string | null;
  details: string | null;
  position: number;
}

export interface AssignmentItem {
  id: string;
  title: string;
  instructions: string | null;
  completionMode: 'practice_days' | 'one_time';
  suggestedPracticeDays: number | null;
  dueAt: string | null;
  position: number;
}

export interface AssignmentSection {
  id: string;
  title: string;
  position: number;
  items: AssignmentItem[];
}

export interface StudentAssignment {
  id: string;
  studentId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: AssignmentStatus;
  notices: AssignmentNotice[];
  sections: AssignmentSection[];
}

export interface PracticeItemProgress {
  itemId: string;
  sectionId: string;
  sectionTitle: string;
  title: string;
  mode: 'practice_days' | 'one_time';
  target: number;
  current: number;
  completed: boolean;
}

export interface PracticeSummary {
  assignmentId: string;
  studentId: string;
  startDate: string;
  endDate: string;
  weeklyMinutes: number;
  distinctPracticeDays: number;
  currentStreak: number;
  xp: number;
  assignmentCompleted: boolean;
  items: PracticeItemProgress[];
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  unlockedAt: string;
}
