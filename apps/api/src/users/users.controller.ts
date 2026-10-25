import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto.js';
import { NicknameAvailabilityQuery } from './dto/nickname-availability.query.js';
import { SetFavoritesDto } from './dto/set-favorites.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /**
   * Check a nickname while the user types. Format errors come back in the body, not as 400.
   */
  @Get('users/nickname-available')
  nicknameAvailable(
    @CurrentUserId() userId: string,
    @Query() query: NicknameAvailabilityQuery,
  ) {
    return this.users.nicknameAvailability(userId, query.nickname);
  }

  /**
   * A reader's public profile: name, bio, links, reading now, totals, recently read.
   * Declared after 'users/nickname-available': routes match in order, and
   * ':nickname' would otherwise swallow that path.
   */
  @Get('users/:nickname')
  publicProfile(
    @CurrentUserId() userId: string,
    @Param('nickname') nickname: string,
  ) {
    return this.users.publicProfile(userId, nickname);
  }

  /**
   * Update any of: display name, nickname, bio, links. Send only what changes.
   */
  @Patch('me/profile')
  updateProfile(
    @CurrentUserId() userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(userId, dto);
  }

  /**
   * Replace my four favorites with these shelf entries, in this order ([] clears them).
   */
  @Put('me/favorites')
  setFavorites(@CurrentUserId() userId: string, @Body() dto: SetFavoritesDto) {
    return this.users.setFavorites(userId, dto.userBookIds);
  }

  /**
   * Finish onboarding: set the display name and nickname. A taken nickname → 409.
   */
  @Post('me/onboarding')
  @HttpCode(200)
  completeOnboarding(
    @CurrentUserId() userId: string,
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.users.completeOnboarding(userId, dto);
  }
}
