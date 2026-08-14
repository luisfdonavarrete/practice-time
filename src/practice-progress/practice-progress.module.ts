import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticeSessionsModule } from '../practice-sessions/practice-sessions.module';
import { DailyPracticeXpAward } from './entities/daily-practice-xp-award.entity';
import { PracticeProgressController } from './practice-progress.controller';
import { PracticeProgressService } from './practice-progress.service';
import { PracticeXpService } from './practice-xp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyPracticeXpAward]),
    PracticeSessionsModule,
  ],
  controllers: [PracticeProgressController],
  providers: [PracticeProgressService, PracticeXpService],
})
export class PracticeProgressModule {}
