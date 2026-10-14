import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type CryptoKey,
} from 'jose';
import { GoogleTokenVerifier } from './google-token.verifier.js';

const WEB_CLIENT_ID = 'web-client.apps.googleusercontent.com';
const KEY_ID = 'test-key';

// A real RS256 key pair plays "Google": no network in tests
let privateKey: CryptoKey;
let verifier: GoogleTokenVerifier;

beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  const publicJwk = { ...(await exportJWK(pair.publicKey)), kid: KEY_ID };

  privateKey = pair.privateKey;
  verifier = new GoogleTokenVerifier({
    getOrThrow: () => `${WEB_CLIENT_ID}, other-client`,
  } as unknown as ConfigService);
  verifier.keys = createLocalJWKSet({ keys: [publicJwk] });
});

function googleToken(claims: Record<string, unknown> = {}) {
  return new SignJWT({
    email: 'reader@gmail.com',
    email_verified: true,
    name: 'Reader',
    ...claims,
  })
    .setProtectedHeader({ alg: 'RS256', kid: KEY_ID })
    .setSubject('google-user-1')
    .setIssuer('https://accounts.google.com')
    .setAudience(WEB_CLIENT_ID)
    .setIssuedAt()
    .setExpirationTime('5m');
}

describe('GoogleTokenVerifier', () => {
  it('accepts a valid token and returns the profile', async () => {
    const token = await googleToken().sign(privateKey);

    await expect(verifier.verify(token)).resolves.toEqual({
      sub: 'google-user-1',
      email: 'reader@gmail.com',
      name: 'Reader',
      picture: null,
    });
  });

  it('drops an unverified email', async () => {
    const token = await googleToken({ email_verified: false }).sign(privateKey);

    await expect(verifier.verify(token)).resolves.toMatchObject({
      email: null,
    });
  });

  it('rejects a token issued for another app', async () => {
    const token = await googleToken()
      .setAudience('someone-elses-app')
      .sign(privateKey);

    await expect(verifier.verify(token)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token from another issuer', async () => {
    const token = await googleToken()
      .setIssuer('https://evil.example.com')
      .sign(privateKey);

    await expect(verifier.verify(token)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an expired token', async () => {
    const token = await googleToken()
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(privateKey);

    await expect(verifier.verify(token)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token signed by a different key', async () => {
    const attacker = await generateKeyPair('RS256');
    const token = await googleToken().sign(attacker.privateKey);

    await expect(verifier.verify(token)).rejects.toThrow(UnauthorizedException);
  });
});
