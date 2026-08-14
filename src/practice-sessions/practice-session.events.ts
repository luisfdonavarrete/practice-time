import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type PracticeSessionEventType =
  | 'practice-session.created'
  | 'practice-session.corrected'
  | 'practice-session.deleted';

export interface PracticeSessionEvent {
  type: PracticeSessionEventType;
  sessionId: string;
  studentId: string;
  assignmentItemId: string | null;
  practiceLocalDate: string;
  occurredAt: string;
}

@Injectable()
export class PracticeSessionEvents {
  private readonly subject = new Subject<PracticeSessionEvent>();

  readonly events$: Observable<PracticeSessionEvent> =
    this.subject.asObservable();

  publish(event: PracticeSessionEvent): void {
    this.subject.next(event);
  }
}
