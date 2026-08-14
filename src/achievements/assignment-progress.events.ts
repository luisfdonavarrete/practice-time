import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export interface AssignmentProgressChangedEvent {
  type: 'assignment-progress.changed';
  studentId: string;
  assignmentId: string;
  itemId: string;
  occurredAt: string;
}

@Injectable()
export class AssignmentProgressEvents {
  private readonly subject = new Subject<AssignmentProgressChangedEvent>();
  readonly events$: Observable<AssignmentProgressChangedEvent> =
    this.subject.asObservable();

  publish(event: AssignmentProgressChangedEvent): void {
    this.subject.next(event);
  }
}
