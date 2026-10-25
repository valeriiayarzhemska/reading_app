import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import {
  BookFormat,
  ShelfStatus,
  type BookPage,
  type BookReview,
  type OwnReview,
  type Page,
  type UserBookWithBook,
} from '@reading/shared';

import { apiFetch } from './client';
import { entryKey, shelfKey } from './shelf';

export const bookPageKey = (bookId: string) => ['bookPage', bookId] as const;
export const reviewsKey = (bookId: string) => ['reviews', bookId] as const;

export function useBookPage(bookId: string) {
  return useQuery({
    queryKey: bookPageKey(bookId),
    queryFn: () => apiFetch<BookPage>(`/books/${bookId}`),
  });
}

export function useBookReviews(bookId: string) {
  return useInfiniteQuery({
    queryKey: reviewsKey(bookId),
    queryFn: ({ pageParam }) =>
      apiFetch<Page<BookReview>>(
        `/books/${bookId}/reviews` + (pageParam ? `?cursor=${pageParam}` : ''),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

interface ReviewInput {
  text: string;
  hasSpoilers: boolean;
}

// Everywhere a review shows up: the book's list and page, and profiles
function invalidateReviews(queryClient: QueryClient, bookId: string) {
  queryClient.invalidateQueries({ queryKey: reviewsKey(bookId) });
  queryClient.invalidateQueries({ queryKey: bookPageKey(bookId) });
  queryClient.invalidateQueries({ queryKey: ['profile'] });
}

export function useSaveReview(entry: UserBookWithBook) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReviewInput) =>
      apiFetch<OwnReview>(`/me/books/${entry.id}/review`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: (review) => {
      queryClient.setQueryData<UserBookWithBook>(
        entryKey(entry.id),
        (current) => current && { ...current, review },
      );
      invalidateReviews(queryClient, entry.bookId);
    },
  });
}

export function useDeleteReview(entry: UserBookWithBook) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<void>(`/me/books/${entry.id}/review`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.setQueryData<UserBookWithBook>(
        entryKey(entry.id),
        (current) => current && { ...current, review: null },
      );
      invalidateReviews(queryClient, entry.bookId);
    },
  });
}

// From the public book page: the book is already in our database, so no
// import step as in search
export function useAddBookToShelf(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<UserBookWithBook>('/me/books', {
        method: 'POST',
        body: JSON.stringify({
          bookId,
          status: ShelfStatus.WANT_TO_READ,
          format: BookFormat.PAPER,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shelfKey });
      queryClient.invalidateQueries({ queryKey: bookPageKey(bookId) });
    },
  });
}
