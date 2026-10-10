import { Injectable, NotFoundException } from '@nestjs/common';
import type { BookSearchResult } from '@reading/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { GoogleBooksClient } from './google-books.client.js';
import { mapVolume } from './google-books.mapper.js';
import { refineResults } from './search-results.js';

// Ask Google for more than we show: filtering and merging remove some.
const GOOGLE_FETCH_LIMIT = 40;
const RESULTS_LIMIT = 20;

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly google: GoogleBooksClient,
  ) {}

  async search(query: string): Promise<BookSearchResult[]> {
    const volumes = await this.google.search(query, GOOGLE_FETCH_LIMIT);
    return refineResults(volumes.map(mapVolume)).slice(0, RESULTS_LIMIT);
  }

  async importFromGoogle(googleBooksId: string) {
    // Already saved by someone? Skip the call to Google.
    const existing = await this.prisma.book.findUnique({
      where: { googleBooksId },
    });
    if (existing) {
      return existing;
    }

    const volume = await this.google.getById(googleBooksId);
    if (!volume) {
      throw new NotFoundException(`Book ${googleBooksId} not found`);
    }

    const data = mapVolume(volume);
    // upsert, not create: two users importing the same book at the same
    // moment must not crash on the unique googleBooksId.
    return this.prisma.book.upsert({
      where: { googleBooksId },
      create: data,
      update: {},
    });
  }
}
