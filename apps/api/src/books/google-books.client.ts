import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  GoogleVolume,
  GoogleVolumesResponse,
} from './google-books.types.js';

const BASE_URL = 'https://www.googleapis.com/books/v1';
const TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 3;

@Injectable()
export class GoogleBooksClient {
  // Pause before retry N is retryDelayMs * N. Tests set it to 0.
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

  getById(id: string): Promise<GoogleVolume | null> {
    return this.request<GoogleVolume>(`/volumes/${encodeURIComponent(id)}`);
  }

  // Returns null on 404. Retries network errors and 5xx (Google's outages are
  // usually brief); throws 502 Bad Gateway once retries run out or on any
  // other failure (4xx won't fix itself by retrying).
  private async request<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T | null> {
    const url = this.buildUrl(path, params);
    let attempt = 0;

    while (true) {
      attempt++;
      const res = await this.fetchOnce(url);

      if (res?.status === 404) {
        return null;
      }

      if (res?.ok) {
        return (await res.json()) as T;
      }

      const isRetryable = !res || res.status >= 500;

      if (!isRetryable || attempt >= MAX_ATTEMPTS) {
        throw new BadGatewayException(
          res
            ? `Google Books responded with ${res.status}`
            : 'Google Books is unreachable',
        );
      }

      await sleep(this.retryDelayMs * attempt);
    }
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

  // null = network error or timeout
  private async fetchOnce(url: URL): Promise<Response | null> {
    try {
      return await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch {
      return null;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
