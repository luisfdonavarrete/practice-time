import { ApiProperty } from '@nestjs/swagger';
import { AchievementKey } from '../entities/student-achievement.entity';

export class AchievementResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: AchievementKey })
  key: AchievementKey;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ format: 'date-time' })
  unlockedAt: string;
}
