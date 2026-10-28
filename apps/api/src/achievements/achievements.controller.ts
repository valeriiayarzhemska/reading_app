import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { AchievementsService } from './achievements.service.js';

@ApiTags('achievements')
@Controller('me/achievements')
export class AchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  /**
   * Every badge: earned or not, and the share of readers who have it.
   */
  @Get()
  mine(@CurrentUserId() userId: string) {
    return this.achievements.mine(userId);
  }
}
