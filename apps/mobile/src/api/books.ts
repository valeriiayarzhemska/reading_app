import { BookSource, type Book, type BookSearchResult } from '@reading/shared';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';

export function searchBooks(query: string) {
  return apiFetch<BookSearchResult[]>(
    `/books/search?q=${encodeURIComponent(query)}`,
  );
}

export function importBook({ source, externalId }: BookSearchResult) {
  return apiFetch<Book>('/books/import', {
    method: 'POST',
    body: JSON.stringify({ source, externalId }),
  });
}

export function useBookSearch(query: string) {
  return useQuery({
    queryKey: ['books', 'search', query],
    queryFn: () => searchBooks(query),
    // Don't search for 0–1 characters
    enabled: query.length >= 2,
  });
}

// One string per result, unique across sources: "OPEN_LIBRARY:OL17860744W"
export function resultKey(result: BookSearchResult): string {
  return `${result.source}:${result.externalId}`;
}

// The same keys for a saved book — one per source it was found in
export function savedBookKeys(book: Book): string[] {
  const keys: string[] = [];

  if (book.openLibraryId) {
    keys.push(`${BookSource.OPEN_LIBRARY}:${book.openLibraryId}`);
  }

  if (book.googleBooksId) {
    keys.push(`${BookSource.GOOGLE}:${book.googleBooksId}`);
  }

  return keys;
}
