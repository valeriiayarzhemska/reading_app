import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import {
  ShelfStatus,
  type DaySession,
  type NewReadingSession,
  type ReadingSpeed,
  type SavedReadingSession,
  type UserBookWithBook,
} from '@reading/shared';

import { useAuth } from '@/auth/AuthContext';
import {
  addPending,
  readPending,
  removePending,
} from '@/timer/pendingSessions';
import { ApiError, apiFetch } from './client';
import { entryKey, shelfKey } from './shelf';

export type SaveOutcome =
  { status: 'saved'; result: SavedReadingSession } | { status: 'queued' };

const speedKey = ['readingSpeed'] as const;

// Pages per hour from the reader's sessions; refreshed after each new session
export function useReadingSpeed() {
  return useQuery({
    queryKey: speedKey,
    queryFn: () => apiFetch<ReadingSpeed>('/me/sessions/speed'),
  });
}

export function saveSession(session: NewReadingSession) {
  return apiFetch<SavedReadingSession>('/me/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
}

// No response at all (offline: fetch throws a TypeError, not an ApiError) or
// a server-side failure may work later. A 4xx means the request itself is
// wrong: sending it again won't help. 401: the token refresh failed, so
// wait for the next sign-in rather than lose the session.
export function isRetryable(error: unknown): boolean {
  return (
    !(error instanceof ApiError) || error.status >= 500 || error.status === 401
  );
}

export function useSaveSession() {
  const queryClient = useQueryClient();
  const { state } = useAuth();
  const userId = state.status === 'signedIn' ? state.user.id : null;

  return useMutation({
    mutationFn: async (session: NewReadingSession): Promise<SaveOutcome> => {
      try {
        return { status: 'saved', result: await saveSession(session) };
      } catch (error) {
        if (!userId || !isRetryable(error)) {
          throw error;
        }

        addPending({ userId, session });

        return { status: 'queued' };
      }
    },
    onSuccess: (outcome, session) => {
      if (outcome.status === 'saved') {
        applySaved(queryClient, outcome.result);
      } else {
        applyQueued(queryClient, session);
      }
    },
  });
}

function applySaved(
  queryClient: QueryClient,
  { userBook }: SavedReadingSession,
) {
  // The response already has the updated book: show it right away, then
  // refresh the list (Library home, shelves) behind it
  queryClient.setQueryData(entryKey(userBook.id), userBook);
  queryClient.invalidateQueries({ queryKey: shelfKey });
  invalidateStats(queryClient);
}

// Everything computed from sessions: speed (time left), calendar, day lists
function invalidateStats(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: speedKey });
  queryClient.invalidateQueries({ queryKey: ['calendar'] });
  queryClient.invalidateQueries({ queryKey: ['daySessions'] });
}

export interface SessionChanges {
  durationSec?: number;
  progressTo?: number;
}

// Editing and deleting change only stats, never the shelf: the book's
// progress stays where it is
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...changes }: SessionChanges & { id: string }) =>
      apiFetch<DaySession>(`/me/sessions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      }),
    onSuccess: () => invalidateStats(queryClient),
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/me/sessions/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateStats(queryClient),
  });
}

// Not confirmed yet, but show the new progress anyway (optimistic). After a
// restart the shelf comes from the server again until the sync succeeds.
function applyQueued(queryClient: QueryClient, session: NewReadingSession) {
  const patch = (entry: UserBookWithBook): UserBookWithBook =>
    entry.id === session.userBookId
      ? {
          ...entry,
          currentProgress: session.progressTo,
          progressUnit: session.unit,
          status:
            entry.status === ShelfStatus.WANT_TO_READ
              ? ShelfStatus.READING
              : entry.status,
        }
      : entry;

  queryClient.setQueryData<UserBookWithBook[]>(shelfKey, (list) =>
    list?.map(patch),
  );
  queryClient.setQueryData<UserBookWithBook>(
    entryKey(session.userBookId),
    (entry) => entry && patch(entry),
  );
}

// Module-level flag: the interval, the foreground event and app start can
// all fire together; only one sync may walk the queue at a time
let isSyncing = false;

// Sends the queue oldest first. Safe to repeat: the server recognizes a
// clientId it has already saved and returns that session instead.
export async function syncPendingSessions(
  queryClient: QueryClient,
  userId: string,
) {
  if (isSyncing) {
    return;
  }

  isSyncing = true;

  try {
    const mine = readPending().filter((item) => item.userId === userId);

    for (const { session } of mine) {
      try {
        applySaved(queryClient, await saveSession(session));
        removePending(session.clientId);
      } catch (error) {
        // Still offline: keep this one and the rest for the next attempt
        if (isRetryable(error)) {
          return;
        }

        // Rejected for good (e.g. the book was removed from the shelf)
        console.warn('Dropping a session the server rejected', error);
        removePending(session.clientId);
      }
    }
  } finally {
    isSyncing = false;
  }
}
