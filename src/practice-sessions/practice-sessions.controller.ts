import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/authenticated-user.decorator';
import { AuthenticatedUser } from '../auth/models/authenticated-user';
import { CreatePracticeSessionDto } from './dto/create-practice-session.dto';
import { ListPracticeSessionsQueryDto } from './dto/list-practice-sessions-query.dto';
import { PracticeSessionResponseDto } from './dto/practice-session-response.dto';
import { UpdatePracticeSessionDto } from './dto/update-practice-session.dto';
import { PracticeSessionMapper } from './practice-session.mapper';
import { PracticeSessionsService } from './practice-sessions.service';

@Controller('practice-sessions')
export class PracticeSessionsController {
  constructor(private readonly sessions: PracticeSessionsService) {}

  @Post()
  async create(
    @Body() dto: CreatePracticeSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PracticeSessionResponseDto> {
    return PracticeSessionMapper.toDto(
      await this.sessions.create(user.userId, dto),
    );
  }

  @Get()
  async findAll(
    @Query() query: ListPracticeSessionsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.sessions.findAll(user.userId, query);
    return {
      ...result,
      data: result.data.map((session) => PracticeSessionMapper.toDto(session)),
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PracticeSessionResponseDto> {
    return PracticeSessionMapper.toDto(
      await this.sessions.findOne(user.userId, id),
    );
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePracticeSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PracticeSessionResponseDto> {
    return PracticeSessionMapper.toDto(
      await this.sessions.update(user.userId, id, dto),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.sessions.remove(user.userId, id);
  }
}
