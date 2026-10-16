import type { NewReadingSession, SavedReadingSession } from '@reading/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { entryKey, shelfKey } from './shelf';

export function saveSession(session: NewReadingSession) {
  return apiFetch<SavedReadingSession>('/me/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
}

export function useSaveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveSession,
    onSuccess: ({ userBook }) => {
      // The response already has the updated book: show it right away,
      // then refresh the list (Library home, shelves) behind it
      queryClient.setQueryData(entryKey(userBook.id), userBook);
      queryClient.invalidateQueries({ queryKey: shelfKey });
    },
  });
}
