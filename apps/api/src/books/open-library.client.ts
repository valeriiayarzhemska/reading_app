import { BadGatewayException, Injectable } from '@nestjs/common';

import { fetchWithRetry } from '../common/fetch-with-retry.js';
import type {
  OpenLibrarySearchResponse,
  OpenLibraryWork,
} from './open-library.types.js';

const SEARCH_URL = 'https://openlibrary.org/search.json';
const FIELDS = 'key,title,author_name,cover_i,number_of_pages_median';

// Open Library asks API clients to identify themselves
const HEADERS = { 'User-Agent': 'ReadingApp/0.1 (learning project)' };

@Injectable()
export class OpenLibraryClient {
  // Tests set this to 0
  retryDelayMs = 300;

  async search(query: string, limit = 20): Promise<OpenLibraryWork[]> {
    const data = await this.request({ q: query, limit: String(limit) });

    return data.docs;
  }

  async searchByIsbn(isbn: string): Promise<OpenLibraryWork[]> {
    const data = await this.request({ isbn });

    return data.docs;
  }

  // The search endpoint also finds a single work by its key, returning the
  // same fields — so one mapper covers search results and imports.
  async getWork(workId: string): Promise<OpenLibraryWork | null> {
    const data = await this.request({ q: `key:"/works/${workId}"` });

    return data.docs[0] ?? null;
  }

  private async request(
    params: Record<string, string>,
  ): Promise<OpenLibrarySearchResponse> {
    const url = new URL(SEARCH_URL);

    for (const [key, value] of Object.entries({ ...params, fields: FIELDS })) {
      url.searchParams.set(key, value);
    }

    const res = await fetchWithRetry(url, {
      headers: HEADERS,
      delayMs: this.retryDelayMs,
    });

    if (!res?.ok) {
      throw new BadGatewayException(
        res
          ? `Open Library responded with ${res.status}`
          : 'Open Library is unreachable',
      );
    }

    return (await res.json()) as OpenLibrarySearchResponse;
  }
}
