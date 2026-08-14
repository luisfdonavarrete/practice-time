import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/authenticated-user.decorator';
import { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AchievementResponseDto } from './dto/achievement-response.dto';
import { AchievementsService } from './achievements.service';

@ApiTags('achievements')
@Controller('students/:studentId/achievements')
export class AchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  @Get()
  @ApiOkResponse({ type: AchievementResponseDto, isArray: true })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<AchievementResponseDto[]> {
    return this.achievements.listForOwner(user.userId, studentId);
  }
}
