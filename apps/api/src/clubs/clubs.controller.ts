import {
  Body,
  Controller,
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
import { ClubsService } from './clubs.service.js';
import { ClubListQuery } from './dto/club-list.query.js';
import { CreateClubDto } from './dto/create-club.dto.js';
import { SetClubBookDto } from './dto/set-club-book.dto.js';

@ApiTags('clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubs: ClubsService) {}

  /**
   * Clubs I'm a member of (also the ones I host).
   * Declared before ':id', which would otherwise take "mine".
   */
  @Get('mine')
  mine(@CurrentUserId() userId: string) {
    return this.clubs.mine(userId);
  }

  /**
   * All clubs, biggest first. ?query= matches the name, the host's nickname or the book.
   */
  @Get()
  all(@CurrentUserId() userId: string, @Query() query: ClubListQuery) {
    return this.clubs.all(userId, query.query);
  }

  /**
   * Create a club; I become its host and first member.
   */
  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateClubDto) {
    return this.clubs.create(userId, dto);
  }

  /**
   * A club's details: description, host, members, current book, whether I'm in.
   */
  @Get(':id')
  detail(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clubs.detail(userId, id);
  }

  /**
   * Join a club. Joining again changes nothing.
   */
  @Put(':id/membership')
  @HttpCode(204)
  join(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clubs.join(userId, id);
  }

  /**
   * Host only: set the book the club reads together (null clears it).
   */
  @Put(':id/book')
  setBook(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetClubBookDto,
  ) {
    return this.clubs.setBook(userId, id, dto.bookId ?? null);
  }
}
