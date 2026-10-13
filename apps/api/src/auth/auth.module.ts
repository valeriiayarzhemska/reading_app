import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { TokenService } from './token.service.js';

@Module({
  controllers: [AuthController],
  providers: [
    TokenService,
    AuthService,
    // Global: every route in the app requires a valid access token
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [TokenService, AuthService],
})
export class AuthModule {}
