import { Controller, Get } from '@nestjs/common';
import type { BookFormat } from '@reading/shared';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('formats')
  getFormats(): BookFormat[] {
    return this.appService.getFormats();
  }
}
