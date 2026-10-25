import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CoverStorage } from './cover-storage.service.js';
import { CreateCoverUploadDto } from './dto/create-cover-upload.dto.js';
import { CreatePhotoUploadDto } from './dto/create-photo-upload.dto.js';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly covers: CoverStorage) {}

  /**
   * Get a short-lived link to upload a book cover (JPEG) straight to storage.
   */
  @Post('cover')
  createCoverUpload(
    @CurrentUserId() userId: string,
    @Body() dto: CreateCoverUploadDto,
  ) {
    return this.covers.createUpload(userId, dto.size);
  }

  /**
   * Get a short-lived link to upload a chat photo (JPEG) straight to storage.
   */
  @Post('chat-photo')
  createChatPhotoUpload(
    @CurrentUserId() userId: string,
    @Body() dto: CreatePhotoUploadDto,
  ) {
    return this.covers.createUpload(userId, dto.size, 'chat');
  }

  /**
   * Get a short-lived link to upload a post photo (JPEG) straight to storage.
   */
  @Post('post-photo')
  createPostPhotoUpload(
    @CurrentUserId() userId: string,
    @Body() dto: CreatePhotoUploadDto,
  ) {
    return this.covers.createUpload(userId, dto.size, 'posts');
  }
}
