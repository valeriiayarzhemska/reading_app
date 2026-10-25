import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import {
  CommentListQuery,
  CreateCommentDto,
  CreatePostDto,
  FeedQuery,
} from './dto/posts.dto.js';
import { PostsService } from './posts.service.js';

@ApiTags('posts')
@Controller()
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  /**
   * The Shelves feed, newest first. feed=following (people I follow and me) or all.
   */
  @Get('posts')
  feed(@CurrentUserId() userId: string, @Query() query: FeedQuery) {
    return this.posts.feed(userId, query.feed, query.cursor);
  }

  /**
   * Write a post: text and/or a photo (from /uploads/post-photo), optionally a book.
   */
  @Post('posts')
  create(@CurrentUserId() userId: string, @Body() dto: CreatePostDto) {
    return this.posts.create(userId, dto);
  }

  /**
   * One post, as in the feed.
   */
  @Get('posts/:id')
  detail(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.posts.detail(userId, id);
  }

  /**
   * Delete my post (its likes and comments go with it).
   */
  @Delete('posts/:id')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.posts.remove(userId, id);
  }

  /**
   * Like a post. Liking again changes nothing.
   */
  @Put('posts/:id/like')
  @HttpCode(204)
  like(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.posts.like(userId, id);
  }

  @Delete('posts/:id/like')
  @HttpCode(204)
  unlike(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.posts.unlike(userId, id);
  }

  /**
   * A post's comments, oldest first. Pass nextCursor as ?cursor= for more.
   */
  @Get('posts/:id/comments')
  comments(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CommentListQuery,
  ) {
    return this.posts.comments(userId, id, query.cursor);
  }

  @Post('posts/:id/comments')
  addComment(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.posts.addComment(userId, id, dto);
  }

  @Put('comments/:id/like')
  @HttpCode(204)
  likeComment(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.posts.likeComment(userId, id);
  }

  @Delete('comments/:id/like')
  @HttpCode(204)
  unlikeComment(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.posts.unlikeComment(userId, id);
  }
}
