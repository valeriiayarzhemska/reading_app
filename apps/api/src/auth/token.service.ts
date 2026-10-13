import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify, SignJWT } from 'jose';

const ISSUER = 'reading-app';
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class TokenService {
  private readonly secret: Uint8Array;

  constructor(config: ConfigService) {
    this.secret = new TextEncoder().encode(
      config.getOrThrow<string>('JWT_SECRET'),
    );
  }

  async signAccessToken(
    userId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuer(ISSUER)
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(this.secret);

    return { token, expiresAt };
  }

  // Returns the user ID, or null for an invalid, tampered or expired token
  async verifyAccessToken(token: string): Promise<string | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: ISSUER,
        algorithms: ['HS256'],
      });

      return payload.sub ?? null;
    } catch {
      return null;
    }
  }

  generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  // A fast hash is fine for 32 random bytes; slow hashes (bcrypt) are for
  // human-chosen passwords that can be guessed
  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
