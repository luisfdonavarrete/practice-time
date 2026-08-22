import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseMapper } from './mappers/user-response.mapper';
import { UserDto } from './dto/user.dto';
import { CurrentUser } from '../auth/decorators/authenticated-user.decorator';
import { AuthenticatedUser } from '../auth/models/authenticated-user';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('authentication')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userResponseMapper: UserResponseMapper,
  ) {}

  @Get('me')
  async findCurrentUser(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ): Promise<UserDto> {
    const user = await this.usersService.findOne(authenticatedUser.userId);
    return this.userResponseMapper.toDto(user);
  }

  @Patch('me')
  async updateCurrentUser(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    const user = await this.usersService.update(
      authenticatedUser.userId,
      updateUserDto,
    );
    return this.userResponseMapper.toDto(user);
  }
}
