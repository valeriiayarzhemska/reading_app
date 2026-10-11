import {
  BookFormat,
  ShelfStatus,
  type BookSearchResult,
  type UserBookWithBook,
} from '@reading/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { importBook } from './books';
import { apiFetch } from './client';

const shelfKey = ['shelf'] as const;

export function fetchShelf() {
  return apiFetch<UserBookWithBook[]>('/me/books');
}

export function useShelf() {
  return useQuery({ queryKey: shelfKey, queryFn: fetchShelf });
}

// Two steps: save the search result in our DB, then put it on the shelf.
export function useAddToShelf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (result: BookSearchResult) => {
      const book = await importBook(result);

      return apiFetch<UserBookWithBook>('/me/books', {
        method: 'POST',
        body: JSON.stringify({
          bookId: book.id,
          status: ShelfStatus.WANT_TO_READ,
          format: BookFormat.PAPER,
        }),
      });
    },
    // The shelf on the server changed → our cached copy is outdated.
    // onSettled (not onSuccess): even after a 409 the import step may have
    // linked a new source ID to the book, so refetch either way.
    onSettled: () => queryClient.invalidateQueries({ queryKey: shelfKey }),
  });
}
