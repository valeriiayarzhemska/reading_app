import type { ConfigService } from '@nestjs/config';
import { SignJWT } from 'jose';

import { TokenService } from './token.service.js';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';

const config = {
  getOrThrow: () => SECRET,
} as unknown as ConfigService;

describe('TokenService', () => {
  const tokens = new TokenService(config);

  it('verifies its own access token and returns the user ID', async () => {
    const { token } = await tokens.signAccessToken('user-1');

    await expect(tokens.verifyAccessToken(token)).resolves.toBe('user-1');
  });

  it('rejects a tampered token', async () => {
    const { token } = await tokens.signAccessToken('user-1');
    const [header, , signature] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: 'admin', iss: 'reading-app' }),
    ).toString('base64url');

    await expect(
      tokens.verifyAccessToken(`${header}.${forgedPayload}.${signature}`),
    ).resolves.toBeNull();
  });

  it('rejects a token signed with another secret', async () => {
    const other = new TokenService({
      getOrThrow: () => 'a-completely-different-secret-of-32-plus-chars',
    } as unknown as ConfigService);
    const { token } = await other.signAccessToken('user-1');

    await expect(tokens.verifyAccessToken(token)).resolves.toBeNull();
  });

  it('rejects an expired token', async () => {
    const expired = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-1')
      .setIssuer('reading-app')
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(SECRET));

    await expect(tokens.verifyAccessToken(expired)).resolves.toBeNull();
  });

  it('generates unique refresh tokens and hashes them deterministically', () => {
    const a = tokens.generateRefreshToken();
    const b = tokens.generateRefreshToken();

    expect(a).not.toBe(b);
    expect(tokens.hashRefreshToken(a)).toBe(tokens.hashRefreshToken(a));
    expect(tokens.hashRefreshToken(a)).not.toBe(a);
  });
});
