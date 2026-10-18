import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CalendarYearQuery } from './dto/calendar-year.query.js';
import { CalendarQuery } from './dto/calendar.query.js';
import { SetGoalDto } from './dto/set-goal.dto.js';
import { StatsService } from './stats.service.js';

// URL params are text; ParseIntPipe turns "2026" into 2026 and answers 400
// for anything that isn't a whole number (the range is checked in the service)
const YearPipe = new ParseIntPipe();

@ApiTags('my stats')
@Controller('me')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  /**
   * Totals (hours, pages, books, average rating), this year, and the goal.
   */
  @Get('stats')
  summary(@CurrentUserId() userId: string) {
    return this.stats.summary(userId);
  }

  /**
   * Minutes read per day over a whole year (the heatmap), in my timezone.
   */
  @Get('calendar/year')
  calendarYear(
    @CurrentUserId() userId: string,
    @Query() query: CalendarYearQuery,
  ) {
    return this.stats.calendarYear(userId, Number(query.year));
  }

  /**
   * Days of a month with the books read, minutes and pages, in my timezone.
   */
  @Get('calendar')
  calendar(@CurrentUserId() userId: string, @Query() query: CalendarQuery) {
    return this.stats.calendar(userId, query.month);
  }

  /**
   * Set the number of books to read in a year (creates or changes the goal).
   */
  @Put('goals/:year')
  setGoal(
    @CurrentUserId() userId: string,
    @Param('year', YearPipe) year: number,
    @Body() dto: SetGoalDto,
  ) {
    return this.stats.setGoal(userId, year, dto.target);
  }

  /**
   * Remove the goal of a year.
   */
  @Delete('goals/:year')
  @HttpCode(204)
  deleteGoal(
    @CurrentUserId() userId: string,
    @Param('year', YearPipe) year: number,
  ) {
    return this.stats.deleteGoal(userId, year);
  }
}
