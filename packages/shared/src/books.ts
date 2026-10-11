import type { BookSource } from './enums.js';

// A book as returned by GET /books/search — not saved in our database yet.
export interface BookSearchResult {
  source: BookSource;
  // ID in that source: Open Library work ("OL17860744W") or Google volume
  externalId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  pageCount: number | null;
  language: string | null;
}
