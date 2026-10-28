import { Module } from '@nestjs/common';

import { PostsModule } from '../posts/posts.module.js';
import { QuotesController } from './quotes.controller.js';
import { QuotesService } from './quotes.service.js';

@Module({
  // PostsService: sharing a quote creates a post
  imports: [PostsModule],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
