import { AssignmentCompletionMode } from '../../student-assignments/entities/student-assignment-item.entity';

export interface PracticeItemProgressDto {
  itemId: string;
  sectionId: string;
  sectionTitle: string;
  title: string;
  mode: AssignmentCompletionMode;
  target: number;
  current: number;
  completed: boolean;
  sectionPosition: number;
  itemPosition: number;
}

export interface PracticeSummaryDto {
  assignmentId: string;
  studentId: string;
  startDate: string;
  endDate: string;
  weeklyMinutes: number;
  distinctPracticeDays: number;
  currentStreak: number;
  xp: number;
  assignmentCompleted: boolean;
  items: PracticeItemProgressDto[];
}
