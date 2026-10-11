import { BookSource, type BookSearchResult } from '@reading/shared';
import type { OpenLibraryWork } from './open-library.types.js';

export function mapWork(work: OpenLibraryWork): BookSearchResult {
  return {
    source: BookSource.OPEN_LIBRARY,
    externalId: workId(work.key),
    title: work.title ?? 'Untitled',
    authors: work.author_name ?? [],
    coverUrl: coverUrl(work.cover_i),
    pageCount: work.number_of_pages_median ?? null,
    // A work groups editions in many languages, so there's no single one
    language: null,
  };
}

// "/works/OL17860744W" → "OL17860744W"
export function workId(key: string): string {
  return key.replace('/works/', '');
}

// M ≈ 180 px wide: sharp enough for lists, light enough for 20 results
export function coverUrl(coverId: number | undefined): string | null {
  if (!coverId) {
    return null;
  }

  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}
