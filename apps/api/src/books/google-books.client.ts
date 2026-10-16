import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fetchWithRetry } from '../common/fetch-with-retry.js';
import type {
  GoogleVolume,
  GoogleVolumesResponse,
} from './google-books.types.js';

const BASE_URL = 'https://www.googleapis.com/books/v1';

@Injectable()
export class GoogleBooksClient {
  // Tests set this to 0
  retryDelayMs = 300;

  constructor(private readonly config: ConfigService) {}

  async search(query: string, limit = 20): Promise<GoogleVolume[]> {
    const data = await this.request<GoogleVolumesResponse>('/volumes', {
      q: query,
      maxResults: String(limit),
      printType: 'books',
    });

    return data?.items ?? [];
  }

  searchByIsbn(isbn: string): Promise<GoogleVolume[]> {
    return this.search(`isbn:${isbn}`, 5);
  }

  getById(id: string): Promise<GoogleVolume | null> {
    return this.request<GoogleVolume>(`/volumes/${encodeURIComponent(id)}`);
  }

  private async request<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T | null> {
    const res = await fetchWithRetry(this.buildUrl(path, params), {
      delayMs: this.retryDelayMs,
    });

    if (res?.status === 404) {
      return null;
    }

    if (!res?.ok) {
      throw new BadGatewayException(
        res
          ? `Google Books responded with ${res.status}`
          : 'Google Books is unreachable',
      );
    }

    return (await res.json()) as T;
  }

  private buildUrl(path: string, params: Record<string, string>): URL {
    const url = new URL(BASE_URL + path);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    url.searchParams.set(
      'key',
      this.config.getOrThrow<string>('GOOGLE_BOOKS_API_KEY'),
    );

    return url;
  }
}
