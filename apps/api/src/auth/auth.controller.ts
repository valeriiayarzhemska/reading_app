import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';

import { DEV_USERS } from '@reading/shared';

import { AuthService } from './auth.service.js';
import { CurrentUserId } from './current-user-id.decorator.js';
import { DevLoginDto } from './dto/dev-login.dto.js';
import { GoogleSignInDto } from './dto/google-sign-in.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { GoogleTokenVerifier } from './google-token.verifier.js';
import { Public } from './public.decorator.js';

const DEV_USER_IDS = new Set<string>(DEV_USERS.map((user) => user.id));

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly google: GoogleTokenVerifier,
    private readonly config: ConfigService,
  ) {}

  /**
   * Sign in (or sign up, the first time) with a Google ID token from the app.
   */
  @Public()
  @Post('google')
  @HttpCode(200)
  async googleSignIn(@Body() dto: GoogleSignInDto) {
    const profile = await this.google.verify(dto.idToken);

    return this.auth.signInWithGoogle(profile);
  }

  /**
   * Development only: sign in as a seeded dev user (Alice or Bob) without Google.
   */
  @Public()
  @Post('dev-login')
  @HttpCode(200)
  devLogin(@Body() dto: DevLoginDto) {
    // 404, not 403: in production this endpoint shouldn't appear to exist
    if (
      this.config.get('NODE_ENV') === 'production' ||
      !DEV_USER_IDS.has(dto.userId)
    ) {
      throw new NotFoundException();
    }

    return this.auth.signIn(dto.userId);
  }

  /**
   * Exchange a refresh token for new tokens. The old refresh token stops working.
   */
  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  /**
   * End the session of this refresh token (this device only).
   */
  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.logout(dto.refreshToken);
  }

  /**
   * The signed-in user.
   */
  @Get('me')
  me(@CurrentUserId() userId: string) {
    return this.auth.me(userId);
  }
}
