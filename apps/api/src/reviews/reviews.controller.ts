import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { ReviewListQuery } from './dto/review-list.query.js';
import { SaveReviewDto } from './dto/save-review.dto.js';
import { ReviewsService } from './reviews.service.js';

// No common prefix: writing is about my shelf, reading is about a book
@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /**
   * Write or edit my review of a book on my Read shelf.
   */
  @Put('me/books/:id/review')
  save(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveReviewDto,
  ) {
    return this.reviews.save(userId, id, dto);
  }

  /**
   * Delete my review (the rating stays).
   */
  @Delete('me/books/:id/review')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviews.remove(userId, id);
  }

  /**
   * A book's reviews by all readers, newest first. Pass nextCursor as ?cursor= for more.
   */
  @Get('books/:id/reviews')
  list(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ReviewListQuery,
  ) {
    return this.reviews.list(userId, id, query.cursor);
  }
}
