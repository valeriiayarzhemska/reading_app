import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { ReportsService } from './reports.service.js';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /**
   * Report a hand-added book, post, comment, chat message or review. Reporting again updates the reason.
   */
  @Post()
  @HttpCode(204)
  create(@CurrentUserId() userId: string, @Body() dto: CreateReportDto) {
    return this.reports.create(userId, dto);
  }
}
