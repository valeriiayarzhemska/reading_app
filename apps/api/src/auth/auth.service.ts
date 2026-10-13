import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthResponse, Me } from '@reading/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { REFRESH_TOKEN_TTL_MS, TokenService } from './token.service.js';

const ME_FIELDS = {
  id: true,
  email: true,
  nickname: true,
  displayName: true,
  avatarUrl: true,
  timezone: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async signIn(userId: string): Promise<AuthResponse> {
    const refreshToken = this.tokens.generateRefreshToken();

    await this.prisma.authSession.create({
      data: {
        userId,
        refreshTokenHash: this.tokens.hashRefreshToken(refreshToken),
        expiresAt: refreshExpiry(),
      },
    });

    return this.buildResponse(userId, refreshToken);
  }

  // Rotation: the old refresh token stops working, the caller gets a new one
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const oldHash = this.tokens.hashRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { refreshTokenHash: oldHash },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    const nextToken = this.tokens.generateRefreshToken();
    // Matching on the old hash too makes rotation atomic: if two requests
    // race with the same token, only one of them wins
    const { count } = await this.prisma.authSession.updateMany({
      where: { id: session.id, refreshTokenHash: oldHash },
      data: {
        refreshTokenHash: this.tokens.hashRefreshToken(nextToken),
        expiresAt: refreshExpiry(),
        lastUsedAt: new Date(),
      },
    });

    if (count === 0) {
      throw new UnauthorizedException('Session expired');
    }

    return this.buildResponse(session.userId, nextToken);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.authSession.deleteMany({
      where: { refreshTokenHash: this.tokens.hashRefreshToken(refreshToken) },
    });
  }

  async me(userId: string): Promise<Me> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: ME_FIELDS,
    });

    // A valid token for a deleted account
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private async buildResponse(
    userId: string,
    refreshToken: string,
  ): Promise<AuthResponse> {
    const access = await this.tokens.signAccessToken(userId);

    return {
      tokens: {
        accessToken: access.token,
        refreshToken,
        accessTokenExpiresAt: access.expiresAt.toISOString(),
      },
      user: await this.me(userId),
    };
  }
}

function refreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}
