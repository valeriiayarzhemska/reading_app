import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface GoogleProfile {
  // Google's permanent user ID: identify users by this, never by email
  sub: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

@Injectable()
export class GoogleTokenVerifier {
  // Google's public keys, cached by jose and picked by the token's `kid`.
  // Tests replace this with a local key set.
  keys: JWTVerifyGetKey = createRemoteJWKSet(
    new URL('https://www.googleapis.com/oauth2/v3/certs'),
  );

  private readonly audiences: string[];

  constructor(config: ConfigService) {
    this.audiences = config
      .getOrThrow<string>('GOOGLE_CLIENT_IDS')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    try {
      const { payload } = await jwtVerify(idToken, this.keys, {
        issuer: GOOGLE_ISSUERS,
        // A token Google issued for some other app must not work here
        audience: this.audiences,
      });

      if (!payload.sub) {
        throw new Error('missing sub');
      }

      return {
        sub: payload.sub,
        // An unverified email could belong to someone else
        email:
          payload.email_verified === true ? stringClaim(payload.email) : null,
        name: stringClaim(payload.name),
        picture: stringClaim(payload.picture),
      };
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}

function stringClaim(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
