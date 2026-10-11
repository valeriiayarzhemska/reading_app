import { bookMatchKey, type BookSearchResult } from '@reading/shared';

// Cleans up raw Google results: drops junk, merges duplicate editions,
// and moves the most complete books to the top.
export function refineResults(results: BookSearchResult[]): BookSearchResult[] {
  return sortByCompleteness(dedupe(results.filter(isUseful)));
}

// A result with neither a cover nor a page count is almost always junk.
export function isUseful(book: BookSearchResult): boolean {
  return book.coverUrl !== null || book.pageCount !== null;
}

// A cover matters more than a page count for picking the right edition.
export function completeness(book: BookSearchResult): number {
  return (book.coverUrl ? 2 : 0) + (book.pageCount ? 1 : 0);
}

// Same title + same first author = same book. Keeps the most complete edition
// in the position where that book first appeared (Google's relevance order).
export function dedupe(results: BookSearchResult[]): BookSearchResult[] {
  const best = new Map<string, BookSearchResult>();

  for (const book of results) {
    const key = bookMatchKey(book.title, book.authors);
    const current = best.get(key);

    if (!current || completeness(book) > completeness(current)) {
      best.set(key, book);
    }
  }

  return [...best.values()];
}

// Array.prototype.sort is stable, so equally complete books keep their order.
export function sortByCompleteness(
  results: BookSearchResult[],
): BookSearchResult[] {
  return [...results].sort((a, b) => completeness(b) - completeness(a));
}
