import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticeSessionsModule } from '../practice-sessions/practice-sessions.module';
import { Student } from '../students/entities/student.entity';
import { UsersModule } from '../users/users.module';
import { AchievementEvents } from './achievement.events';
import { AchievementsController } from './achievements.controller';
import { AchievementsGateway } from './achievements.gateway';
import { AchievementsService } from './achievements.service';
import { AssignmentItemCompletionsController } from './assignment-item-completions.controller';
import { AssignmentItemCompletionsService } from './assignment-item-completions.service';
import { AssignmentProgressEvents } from './assignment-progress.events';
import { StudentAchievement } from './entities/student-achievement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentAchievement, Student]),
    PracticeSessionsModule,
    UsersModule,
  ],
  controllers: [AchievementsController, AssignmentItemCompletionsController],
  providers: [
    AchievementEvents,
    AssignmentProgressEvents,
    AchievementsService,
    AchievementsGateway,
    AssignmentItemCompletionsService,
  ],
  exports: [AchievementEvents, AchievementsService],
})
export class AchievementsModule {}
