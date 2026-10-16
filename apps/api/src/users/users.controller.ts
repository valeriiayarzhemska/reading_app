import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto.js';
import { NicknameAvailabilityQuery } from './dto/nickname-availability.query.js';
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
