import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EMPTY, Subscription, catchError, filter, from, mergeMap } from 'rxjs';
import { Repository } from 'typeorm';
import { PracticeSessionEvents } from '../practice-sessions/practice-session.events';
import { DailyPracticeXpAward } from './entities/daily-practice-xp-award.entity';

@Injectable()
export class PracticeXpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PracticeXpService.name);
  private subscription?: Subscription;

  constructor(
    @InjectRepository(DailyPracticeXpAward)
    private readonly awards: Repository<DailyPracticeXpAward>,
    private readonly sessionEvents: PracticeSessionEvents,
  ) {}

  onModuleInit(): void {
    this.subscription = this.sessionEvents.events$
      .pipe(
        filter((event) => event.type !== 'practice-session.deleted'),
        mergeMap((event) =>
          this.award(event.studentId, event.practiceLocalDate).pipe(
            catchError((error: unknown) => {
              this.logger.error('Failed to award daily practice XP', error);
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe();
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private award(studentId: string, practiceLocalDate: string) {
    return from(
      this.awards
        .createQueryBuilder()
        .insert()
        .values({ studentId, practiceLocalDate, xpAmount: 10 })
        .orIgnore()
        .execute(),
    );
  }
}
