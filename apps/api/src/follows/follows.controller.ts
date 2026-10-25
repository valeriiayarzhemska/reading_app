import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { FollowListQuery } from './dto/follow-list.query.js';
import { FollowsService } from './follows.service.js';

@ApiTags('follows')
@Controller('users/:nickname')
export class FollowsController {
  constructor(private readonly follows: FollowsService) {}

  /**
   * Follow this reader. Following again changes nothing.
   */
  @Put('follow')
  @HttpCode(204)
  follow(@CurrentUserId() userId: string, @Param('nickname') nickname: string) {
    return this.follows.follow(userId, nickname);
  }

  /**
   * Stop following this reader. Unfollowing someone you don't follow changes nothing.
   */
  @Delete('follow')
  @HttpCode(204)
  unfollow(
    @CurrentUserId() userId: string,
    @Param('nickname') nickname: string,
  ) {
    return this.follows.unfollow(userId, nickname);
  }

  /**
   * Who follows this reader, newest first. Pass nextCursor as ?cursor= for more.
   */
  @Get('followers')
  followers(
    @CurrentUserId() userId: string,
    @Param('nickname') nickname: string,
    @Query() query: FollowListQuery,
  ) {
    return this.follows.list(userId, nickname, 'followers', query.cursor);
  }

  /**
   * Whom this reader follows, newest first. Pass nextCursor as ?cursor= for more.
   */
  @Get('following')
  following(
    @CurrentUserId() userId: string,
    @Param('nickname') nickname: string,
    @Query() query: FollowListQuery,
  ) {
    return this.follows.list(userId, nickname, 'following', query.cursor);
  }
}
