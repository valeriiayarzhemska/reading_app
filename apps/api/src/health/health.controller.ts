import { Controller, Get } from '@nestjs/common';

import { Public } from '../auth/public.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liveness check for hosting platforms. Public: no token needed.
   */
  @Public()
  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;

    return { status: 'ok', db: 'up' };
  }
}
