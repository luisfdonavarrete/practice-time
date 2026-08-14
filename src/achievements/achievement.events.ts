import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { AchievementKey } from './entities/student-achievement.entity';

export interface AchievementUnlockedEvent {
  type: 'achievement.unlocked';
  achievementId: string;
  studentId: string;
  achievementKey: AchievementKey;
  title: string;
  description: string;
  unlockedAt: string;
}

@Injectable()
export class AchievementEvents {
  private readonly subject = new Subject<AchievementUnlockedEvent>();
  readonly events$: Observable<AchievementUnlockedEvent> =
    this.subject.asObservable();

  publish(event: AchievementUnlockedEvent): void {
    this.subject.next(event);
  }
}
