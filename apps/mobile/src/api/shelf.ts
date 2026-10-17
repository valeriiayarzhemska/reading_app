import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  BookFormat,
  ShelfStatus,
  type Book,
  type BookSearchResult,
  type UserBookWithBook,
} from '@reading/shared';

import { importBook } from './books';
import { apiFetch } from './client';
import { uploadCover } from './uploads';

// ['shelf'] is the list, ['shelf', id] one entry. Invalidating ['shelf']
// refreshes both: React Query matches keys by prefix.
export const shelfKey = ['shelf'] as const;
export const entryKey = (id: string) => ['shelf', id] as const;

export function fetchShelf() {
  return apiFetch<UserBookWithBook[]>('/me/books');
}

export function useShelf() {
  return useQuery({ queryKey: shelfKey, queryFn: fetchShelf });
}

export function useShelfEntry(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: entryKey(id),
    queryFn: () => apiFetch<UserBookWithBook>(`/me/books/${id}`),
    // The list already has this entry: show it instantly, refetch behind it
    initialData: () =>
      queryClient
        .getQueryData<UserBookWithBook[]>(shelfKey)
        ?.find((entry) => entry.id === id),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(shelfKey)?.dataUpdatedAt,
  });
}

function patchEntry(id: string, body: Record<string, unknown>) {
  return apiFetch<UserBookWithBook>(`/me/books/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// Optimistic: the switch moves instantly and rolls back if the server refuses
export function useUpdateStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: ShelfStatus) => patchEntry(id, { status }),
    onMutate: async (status) => {
      // A refetch landing now would overwrite the optimistic value
      await queryClient.cancelQueries({ queryKey: shelfKey });

      const previousList =
        queryClient.getQueryData<UserBookWithBook[]>(shelfKey);
      const previousEntry = queryClient.getQueryData<UserBookWithBook>(
        entryKey(id),
      );

      queryClient.setQueryData<UserBookWithBook[]>(shelfKey, (list) =>
        list?.map((entry) => (entry.id === id ? { ...entry, status } : entry)),
      );
      queryClient.setQueryData<UserBookWithBook>(entryKey(id), (entry) =>
        entry ? { ...entry, status } : entry,
      );

      return { previousList, previousEntry };
    },
    onError: (_error, _status, context) => {
      queryClient.setQueryData(shelfKey, context?.previousList);
      queryClient.setQueryData(entryKey(id), context?.previousEntry);
    },
    // Either way, sync with the server (it also sets startedAt / finishedAt)
    onSettled: () => queryClient.invalidateQueries({ queryKey: shelfKey }),
  });
}

export function useUpdateProgress(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (currentProgress: number) =>
      patchEntry(id, { currentProgress }),
    onSuccess: (updated) => {
      queryClient.setQueryData(entryKey(id), updated);
      queryClient.invalidateQueries({ queryKey: shelfKey });
    },
  });
}

export function useRemoveFromShelf(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<void>(`/me/books/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.setQueryData<UserBookWithBook[]>(shelfKey, (list) =>
        list?.filter((entry) => entry.id !== id),
      );
      queryClient.removeQueries({ queryKey: entryKey(id) });
    },
  });
}

export interface ManualBook {
  title: string;
  authors: string[];
  pageCount?: number;
  // Local file:// URI; uploaded first, then saved as the book's coverUrl
  coverUri?: string;
  status: ShelfStatus;
}

export function useAddManualBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ status, coverUri, ...book }: ManualBook) => {
      const coverUrl = coverUri ? await uploadCover(coverUri) : undefined;

      const created = await apiFetch<Book>('/books', {
        method: 'POST',
        body: JSON.stringify({ ...book, coverUrl }),
      });

      return apiFetch<UserBookWithBook>('/me/books', {
        method: 'POST',
        body: JSON.stringify({
          bookId: created.id,
          status,
          format: BookFormat.PAPER,
        }),
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: shelfKey }),
  });
}

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
    // onSettled, not onSuccess: even after a 409 the import may have linked
    // a new source ID to the book
    onSettled: () => queryClient.invalidateQueries({ queryKey: shelfKey }),
  });
}
