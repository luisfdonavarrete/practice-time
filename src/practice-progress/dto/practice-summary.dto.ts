import { AssignmentCompletionMode } from '../../student-assignments/entities/student-assignment-item.entity';

export class PracticeItemProgressDto {
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

export class PracticeSummaryDto {
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
