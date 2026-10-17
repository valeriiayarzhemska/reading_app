import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  BookSource,
  normalizeIsbn,
  type BookSearchResult,
} from '@reading/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoverStorage } from '../uploads/cover-storage.service.js';
import type { CreateBookDto } from './dto/create-book.dto.js';
import { findMatchingBook } from './find-matching-book.js';
import { GoogleBooksClient } from './google-books.client.js';
import { mapVolume } from './google-books.mapper.js';
import { OpenLibraryClient } from './open-library.client.js';
import { mapWork } from './open-library.mapper.js';
import {
  dedupe,
  isUseful,
  refineResults,
  withLibraryBooks,
} from './search-results.js';

// Ask Google for more than we show: filtering and merging remove some.
const GOOGLE_FETCH_LIMIT = 40;
const RESULTS_LIMIT = 20;
const LIBRARY_RESULTS_LIMIT = 5;

interface LibraryBookRow {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  pageCount: number | null;
}

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openLibrary: OpenLibraryClient,
    private readonly google: GoogleBooksClient,
    private readonly covers: CoverStorage,
  ) {}

  // Open Library ranks by popularity (Google only by word match); Google
  // covers outages and editions Open Library lacks, e.g. some Ukrainian ones.
  async search(query: string): Promise<BookSearchResult[]> {
    const isbn = normalizeIsbn(query);

    if (isbn) {
      return this.searchByIsbn(isbn);
    }

    const [catalogue, library] = await Promise.all([
      this.searchCatalogue(query),
      this.searchLibrary(query),
    ]);

    return withLibraryBooks(catalogue, library);
  }

  createManual(userId: string, dto: CreateBookDto) {
    if (dto.coverUrl && !this.covers.isOwnCover(userId, dto.coverUrl)) {
      throw new BadRequestException('coverUrl must come from /uploads/cover');
    }

    return this.prisma.book.create({
      data: {
        title: dto.title,
        authors: dto.authors ?? [],
        pageCount: dto.pageCount ?? null,
        coverUrl: dto.coverUrl ?? null,
        createdById: userId,
      },
    });
  }

  async importBook(source: BookSource, externalId: string) {
    // Already in our database: nothing to fetch or save
    if (source === BookSource.LIBRARY) {
      const book = await this.prisma.book.findFirst({
        where: { id: externalId, googleBooksId: null, openLibraryId: null },
      });

      if (!book) {
        throw new NotFoundException(`Book ${externalId} not found`);
      }

      return book;
    }

    const where =
      source === BookSource.GOOGLE
        ? { googleBooksId: externalId }
        : { openLibraryId: externalId };

    const existing = await this.prisma.book.findUnique({ where });

    if (existing) {
      return existing;
    }

    const result = await this.fetchFromSource(source, externalId);

    if (!result) {
      throw new NotFoundException(`Book ${externalId} not found`);
    }

    // Same book saved from the other source? Attach this ID instead of
    // duplicating. A row that already has a different ID here is another book.
    // Hand-added books (no IDs at all) keep their reader-entered data.
    const candidates = await this.prisma.book.findMany({
      where: {
        title: { equals: result.title, mode: 'insensitive' },
        [this.idColumn(source)]: null,
        [this.otherIdColumn(source)]: { not: null },
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

  private otherIdColumn(source: BookSource) {
    return source === BookSource.GOOGLE ? 'openLibraryId' : 'googleBooksId';
  }

  // Open Library ranks by popularity (Google only by word match); Google
  // covers outages and editions Open Library lacks, e.g. some Ukrainian ones.
  private async searchCatalogue(query: string): Promise<BookSearchResult[]> {
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

  // Hand-added books whose title or any author contains the query
  private async searchLibrary(query: string): Promise<BookSearchResult[]> {
    // % and _ are LIKE wildcards: escaped, so "50%" means the text "50%"
    const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`;

    const books = await this.prisma.$queryRaw<LibraryBookRow[]>`
      SELECT id, title, authors, "coverUrl", "pageCount"
      FROM "Book"
      WHERE "googleBooksId" IS NULL
        AND "openLibraryId" IS NULL
        AND (
          title ILIKE ${pattern}
          OR EXISTS (SELECT 1 FROM unnest(authors) AS author WHERE author ILIKE ${pattern})
        )
      ORDER BY "createdAt" DESC
      LIMIT ${LIBRARY_RESULTS_LIMIT}
    `;

    return books.map((book) => ({
      source: BookSource.LIBRARY,
      externalId: book.id,
      title: book.title,
      authors: book.authors,
      coverUrl: book.coverUrl,
      pageCount: book.pageCount,
      language: null,
    }));
  }

  // Same fallback order as a text search, without the ranking: an ISBN
  // matches one edition, so there's nothing to rank
  private async searchByIsbn(isbn: string): Promise<BookSearchResult[]> {
    try {
      const works = await this.openLibrary.searchByIsbn(isbn);

      if (works.length > 0) {
        return works.map(mapWork);
      }
    } catch (error) {
      this.logger.warn(`Open Library failed, using Google: ${String(error)}`);
    }

    const volumes = await this.google.searchByIsbn(isbn);

    return volumes.map(mapVolume);
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
