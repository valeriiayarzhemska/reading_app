import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  GoogleVolume,
  GoogleVolumesResponse,
} from './google-books.types.js';

const BASE_URL = 'https://www.googleapis.com/books/v1';
const TIMEOUT_MS = 5000;

@Injectable()
export class GoogleBooksClient {
  constructor(private readonly config: ConfigService) {}

  async search(query: string, limit = 20): Promise<GoogleVolume[]> {
    const data = await this.request<GoogleVolumesResponse>('/volumes', {
      q: query,
      maxResults: String(limit),
      printType: 'books',
    });
    return data?.items ?? [];
  }

  getById(id: string): Promise<GoogleVolume | null> {
    return this.request<GoogleVolume>(`/volumes/${encodeURIComponent(id)}`);
  }

  // Returns null on 404; throws 502 Bad Gateway on any other failure.
  private async request<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T | null> {
    const url = new URL(BASE_URL + path);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    url.searchParams.set(
      'key',
      this.config.getOrThrow<string>('GOOGLE_BOOKS_API_KEY'),
    );

    let res: Response;

    try {
      res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch {
      throw new BadGatewayException('Google Books is unreachable');
    }

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new BadGatewayException(
        `Google Books responded with ${res.status}`,
      );
    }

    return (await res.json()) as T;
  }
}
