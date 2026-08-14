import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/authenticated-user.decorator';
import { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AssignmentResourceResponseDto } from '../student-assignments/dto/assignment-resource-response.dto';
import { AssignmentResourcesService } from './assignment-resources.service';
import { CreateLinkResourceDto } from './dto/create-link-resource.dto';
import { CreateUploadResourceDto } from './dto/create-upload-resource.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller()
export class AssignmentResourcesController {
  constructor(private readonly resources: AssignmentResourcesService) {}

  @Post('student-assignment-items/:itemId/resources/upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateUploadResourceDto })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: CreateUploadResourceDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return new AssignmentResourceResponseDto(
      await this.resources.createUpload(user.userId, itemId, dto, file),
    );
  }

  @Post('student-assignment-items/:itemId/resources/links')
  async createLink(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: CreateLinkResourceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return new AssignmentResourceResponseDto(
      await this.resources.createLink(user.userId, itemId, dto),
    );
  }

  @Get('student-assignment-items/:itemId/resources')
  async findAll(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return (await this.resources.findAll(user.userId, itemId)).map(
      (resource) => new AssignmentResourceResponseDto(resource),
    );
  }

  @Get('assignment-resources/:resourceId/access-url')
  getAccessUrl(
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resources.getSignedUrl(user.userId, resourceId);
  }

  @Delete('assignment-resources/:resourceId')
  remove(
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resources.remove(user.userId, resourceId);
  }
}
