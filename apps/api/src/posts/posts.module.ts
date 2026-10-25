import { Module } from '@nestjs/common';

import { UploadsModule } from '../uploads/uploads.module.js';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';

@Module({
  // CoverStorage: a post photo must be one the author uploaded
  imports: [UploadsModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
