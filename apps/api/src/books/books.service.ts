import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BookSource, type BookSearchResult } from '@reading/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { findMatchingBook } from './find-matching-book.js';
import { GoogleBooksClient } from './google-books.client.js';
import { mapVolume } from './google-books.mapper.js';
import { OpenLibraryClient } from './open-library.client.js';
import { mapWork } from './open-library.mapper.js';
import { dedupe, isUseful, refineResults } from './search-results.js';

// Ask Google for more than we show: filtering and merging remove some.
const GOOGLE_FETCH_LIMIT = 40;
const RESULTS_LIMIT = 20;

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openLibrary: OpenLibraryClient,
    private readonly google: GoogleBooksClient,
  ) {}

  // Open Library first: it ranks by popularity, so "court of" finds the
  // Maas books instead of court reports. Google is the fallback when Open
  // Library fails or finds nothing (e.g. some Ukrainian editions).
  async search(query: string): Promise<BookSearchResult[]> {
    try {
      const results = await this.searchOpenLibrary(query);

      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      this.logger.warn(`Open Library failed, using Google: ${String(error)}`);
    }

    return this.searchGoogle(query);
  }

  async importBook(source: BookSource, externalId: string) {
    const where =
      source === BookSource.GOOGLE
        ? { googleBooksId: externalId }
        : { openLibraryId: externalId };

    // Already saved by someone? Skip the external call.
    const existing = await this.prisma.book.findUnique({ where });

    if (existing) {
      return existing;
    }

    const result = await this.fetchFromSource(source, externalId);

    if (!result) {
      throw new NotFoundException(`Book ${externalId} not found`);
    }

    // Same book already saved from the other source (e.g. seeded from Google,
    // now found on Open Library)? Attach this ID to it instead of duplicating.
    // Only rows with an empty column for this source are candidates: a row
    // with a different ID there is a different book.
    const candidates = await this.prisma.book.findMany({
      where: {
        title: { equals: result.title, mode: 'insensitive' },
        [this.idColumn(source)]: null,
      },
    });
    const match = findMatchingBook(candidates, result);

    if (match) {
      return this.prisma.book.update({ where: { id: match.id }, data: where });
    }

    const { source: _source, externalId: _id, ...data } = result;

    // upsert, not create: two users importing the same book at the same
    // moment must not crash on the unique external ID.
    return this.prisma.book.upsert({
      where,
      create: { ...data, ...where },
      update: {},
    });
  }

  private idColumn(source: BookSource) {
    return source === BookSource.GOOGLE ? 'googleBooksId' : 'openLibraryId';
  }

  private async searchOpenLibrary(query: string) {
    const works = await this.openLibrary.search(query, RESULTS_LIMIT);

    // No sorting by completeness here: it would undo the popularity order
    return dedupe(works.map(mapWork).filter(isUseful));
  }

  private async searchGoogle(query: string) {
    const volumes = await this.google.search(query, GOOGLE_FETCH_LIMIT);

    return refineResults(volumes.map(mapVolume)).slice(0, RESULTS_LIMIT);
  }

  private async fetchFromSource(
    source: BookSource,
    externalId: string,
  ): Promise<BookSearchResult | null> {
    if (source === BookSource.GOOGLE) {
      const volume = await this.google.getById(externalId);

      return volume ? mapVolume(volume) : null;
    }

    const work = await this.openLibrary.getWork(externalId);

    return work ? mapWork(work) : null;
  }
}
