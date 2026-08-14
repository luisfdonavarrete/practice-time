import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/authenticated-user.decorator';
import { AuthenticatedUser } from '../auth/models/authenticated-user';
import { PracticeSummaryDto } from './dto/practice-summary.dto';
import { PracticeProgressService } from './practice-progress.service';

@Controller('student-assignments')
export class PracticeProgressController {
  constructor(private readonly progress: PracticeProgressService) {}

  @Get(':assignmentId/practice-summary')
  getAssignmentSummary(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PracticeSummaryDto> {
    return this.progress.getAssignmentSummary(user.userId, assignmentId);
  }
}
