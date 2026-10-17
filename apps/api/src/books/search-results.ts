import { bookMatchKey, type BookSearchResult } from '@reading/shared';

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

// Keeps the most complete edition, at the position where the book first
// appeared, to preserve relevance order
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

// Books readers added by hand go after the catalogue results, minus any the
// catalogue already has (someone typed in a book before finding it there)
export function withLibraryBooks(
  catalogue: BookSearchResult[],
  library: BookSearchResult[],
): BookSearchResult[] {
  const known = new Set(
    catalogue.map((book) => bookMatchKey(book.title, book.authors)),
  );

  return [
    ...catalogue,
    ...library.filter(
      (book) => !known.has(bookMatchKey(book.title, book.authors)),
    ),
  ];
}

// Array.prototype.sort is stable, so equally complete books keep their order.
export function sortByCompleteness(
  results: BookSearchResult[],
): BookSearchResult[] {
  return [...results].sort((a, b) => completeness(b) - completeness(a));
}
