import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/authenticated-user.decorator';
import { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AssignmentItemCompletionsService } from './assignment-item-completions.service';
import { AssignmentItemCompletionResponseDto } from './dto/assignment-item-completion-response.dto';

@ApiTags('assignment progress')
@ApiBearerAuth('bearer')
@Controller('student-assignment-items/:itemId/completion')
export class AssignmentItemCompletionsController {
  constructor(private readonly completions: AssignmentItemCompletionsService) {}

  @Put()
  @ApiOkResponse({ type: AssignmentItemCompletionResponseDto })
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<AssignmentItemCompletionResponseDto> {
    return this.completions.complete(user.userId, itemId);
  }

  @Delete()
  @HttpCode(204)
  @ApiNoContentResponse()
  reopen(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<void> {
    return this.completions.reopen(user.userId, itemId);
  }
}
