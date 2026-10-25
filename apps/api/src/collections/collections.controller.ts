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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CollectionsService } from './collections.service.js';
import { SaveCollectionDto } from './dto/save-collection.dto.js';

// Writing under me/, reading and liking anyone's under collections/
@ApiTags('collections')
@Controller()
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  /**
   * Create a collection from books on my shelf, in this order.
   */
  @Post('me/collections')
  create(@CurrentUserId() userId: string, @Body() dto: SaveCollectionDto) {
    return this.collections.create(userId, dto);
  }

  /**
   * Replace my collection's title, description and books (in this order).
   */
  @Put('me/collections/:id')
  update(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveCollectionDto,
  ) {
    return this.collections.update(userId, id, dto);
  }

  /**
   * Delete my collection.
   */
  @Delete('me/collections/:id')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collections.remove(userId, id);
  }

  /**
   * Anyone's collection with all its books, likes and whether I liked it.
   */
  @Get('collections/:id')
  detail(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collections.detail(userId, id);
  }

  /**
   * Like a collection. Liking again changes nothing.
   */
  @Put('collections/:id/like')
  @HttpCode(204)
  like(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collections.like(userId, id);
  }

  /**
   * Remove my like.
   */
  @Delete('collections/:id/like')
  @HttpCode(204)
  unlike(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collections.unlike(userId, id);
  }
}
