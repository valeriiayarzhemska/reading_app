import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CalendarQuery } from './dto/calendar.query.js';
import { StatsService } from './stats.service.js';

@ApiTags('my stats')
@Controller('me')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  /**
   * Days of a month with the books read, minutes and pages, in my timezone.
   */
  @Get('calendar')
  calendar(@CurrentUserId() userId: string, @Query() query: CalendarQuery) {
    return this.stats.calendar(userId, query.month);
  }
}
