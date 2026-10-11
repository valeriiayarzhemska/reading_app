import type { Book, BookSearchResult } from '@reading/shared';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';

export function searchBooks(query: string) {
  return apiFetch<BookSearchResult[]>(
    `/books/search?q=${encodeURIComponent(query)}`,
  );
}

export function importBook(googleBooksId: string) {
  return apiFetch<Book>('/books/import', {
    method: 'POST',
    body: JSON.stringify({ googleBooksId }),
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
