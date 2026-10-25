import { randomUUID } from 'node:crypto';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { CoverUpload } from '@reading/shared';

const UPLOAD_URL_TTL_SECONDS = 5 * 60;

// Book covers and chat photos, each in its own folder per user
export type ImageFolder = 'covers' | 'chat';

// Cloudflare R2 speaks the S3 protocol, so the AWS SDK works with it:
// only the endpoint differs from Amazon
@Injectable()
export class CoverStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService) {
    const accountId = config.getOrThrow<string>('R2_ACCOUNT_ID');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = config.getOrThrow<string>('R2_BUCKET');
    this.publicUrl = config
      .getOrThrow<string>('R2_PUBLIC_URL')
      .replace(/\/$/, '');
  }

  async createUpload(
    userId: string,
    size: number,
    folder: ImageFolder = 'covers',
  ): Promise<CoverUpload> {
    // A random name per upload: replacing a cover never shows a cached old one
    const key = `${folder}/${userId}/${randomUUID()}.jpg`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: 'image/jpeg',
      ContentLength: size,
    });

    // Signing type and length means the link accepts only a JPEG of exactly
    // the size we approved, not a 2 GB video
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
      signableHeaders: new Set(['content-type', 'content-length']),
    });

    return { uploadUrl, publicUrl: `${this.publicUrl}/${key}` };
  }

  isOwnCover(userId: string, url: string): boolean {
    return this.isOwnImage(userId, url, 'covers');
  }

  // Only a file from this user's own folder, with a name we generated
  isOwnImage(userId: string, url: string, folder: ImageFolder): boolean {
    const prefix = `${this.publicUrl}/${folder}/${userId}/`;

    return (
      url.startsWith(prefix) &&
      /^[0-9a-f-]{36}\.jpg$/.test(url.slice(prefix.length))
    );
  }
}
