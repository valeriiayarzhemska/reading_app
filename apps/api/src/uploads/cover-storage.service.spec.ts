import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { CoverStorage } from './cover-storage.service.js';

const ENV: Record<string, string> = {
  R2_ACCOUNT_ID: 'account',
  R2_ACCESS_KEY_ID: 'key-id',
  R2_SECRET_ACCESS_KEY: 'secret',
  R2_BUCKET: 'covers',
  R2_PUBLIC_URL: 'https://pub-test.r2.dev/',
};
const config = { getOrThrow: (key: string) => ENV[key] } as ConfigService;
const storage = new CoverStorage(config);

const ALICE = '00000000-0000-4000-8000-000000000001';
const BOB = '00000000-0000-4000-8000-000000000002';
const FILE = '0f8fad5b-d9cb-469f-a165-70867728950e.jpg';

describe('CoverStorage', () => {
  it('signs an upload into the user folder, with type and size', async () => {
    const upload = await storage.createUpload(ALICE, 1234);

    expect(upload.publicUrl).toMatch(
      new RegExp(
        `^https://pub-test\\.r2\\.dev/covers/${ALICE}/[0-9a-f-]{36}\\.jpg$`,
      ),
    );
    expect(upload.uploadUrl).toContain('X-Amz-Signature=');
    expect(upload.uploadUrl).toContain('content-length');
    expect(storage.isOwnCover(ALICE, upload.publicUrl)).toBe(true);
  });

  it('accepts only files from the user own folder', () => {
    const base = 'https://pub-test.r2.dev/covers';

    expect(storage.isOwnCover(ALICE, `${base}/${ALICE}/${FILE}`)).toBe(true);
    expect(storage.isOwnCover(BOB, `${base}/${ALICE}/${FILE}`)).toBe(false);
    expect(
      storage.isOwnCover(ALICE, `${base}/${ALICE}/../${BOB}/${FILE}`),
    ).toBe(false);
    expect(storage.isOwnCover(ALICE, 'https://evil.example/cover.jpg')).toBe(
      false,
    );
  });
});
