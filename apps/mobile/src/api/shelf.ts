import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import {
  BookFormat,
  ShelfStatus,
  type Book,
  type BookSearchResult,
  type DatePrecision,
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
    // Either way, sync with the server (it also sets startedAt / finishedAt,
    // which count in the stats and as "finished" days in the calendar)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: shelfKey });
      invalidateBookStats(queryClient);
    },
  });
}

// Stats that count books (read, finished this year), calendar days, and the
// public profile (reading now, ratings, recently read). A rating also moves
// the book's average and shows next to its reviews.
function invalidateBookStats(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['stats'] });
  queryClient.invalidateQueries({ queryKey: ['calendar'] });
  queryClient.invalidateQueries({ queryKey: ['profile'] });
  queryClient.invalidateQueries({ queryKey: ['bookPage'] });
  queryClient.invalidateQueries({ queryKey: ['reviews'] });
  // A finished book can earn a badge
  queryClient.invalidateQueries({ queryKey: ['achievements'] });
}

export function useUpdateProgress(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (currentProgress: number) =>
      patchEntry(id, { currentProgress }),
    onSuccess: (updated) => {
      queryClient.setQueryData(entryKey(id), updated);
      queryClient.invalidateQueries({ queryKey: shelfKey });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export interface FinishDetails {
  finishedAt: string;
  finishedPrecision: DatePrecision;
  startedAt?: string;
  rating: number | null;
}

// The "finished, rate it?" sheet: real finish date (maybe years ago), its
// precision, optionally the start, and the rating, in one request
export function useSaveFinish(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (details: FinishDetails) => patchEntry(id, { ...details }),
    onSuccess: (updated) => {
      queryClient.setQueryData(entryKey(id), updated);
      queryClient.invalidateQueries({ queryKey: shelfKey });
      // The finish moved to another day (or year)
      invalidateBookStats(queryClient);
    },
  });
}

// Removes a finish date: "Actually not finished yet" (with the status to go
// back to) or the ✕ on a finished book in the calendar (status unchanged)
export function useRemoveFinish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status?: ShelfStatus }) =>
      patchEntry(id, { finishedAt: null, status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(entryKey(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: shelfKey });
      invalidateBookStats(queryClient);
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
      // Its sessions are deleted with it (cascade): every total changes
      invalidateBookStats(queryClient);
      queryClient.invalidateQueries({ queryKey: ['readingSpeed'] });
      queryClient.invalidateQueries({ queryKey: ['daySessions'] });
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
