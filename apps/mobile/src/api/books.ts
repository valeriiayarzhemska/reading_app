import { useQuery } from '@tanstack/react-query';

import { BookSource, type Book, type BookSearchResult } from '@reading/shared';

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
    enabled: query.length >= 2,
  });
}

export function resultKey(result: BookSearchResult): string {
  return `${result.source}:${result.externalId}`;
}

export function savedBookKeys(book: Book): string[] {
  const keys = [`${BookSource.LIBRARY}:${book.id}`];

  if (book.openLibraryId) {
    keys.push(`${BookSource.OPEN_LIBRARY}:${book.openLibraryId}`);
  }

  if (book.googleBooksId) {
    keys.push(`${BookSource.GOOGLE}:${book.googleBooksId}`);
  }

  return keys;
}
