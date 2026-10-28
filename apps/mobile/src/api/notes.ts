import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BookNote, NoteInput } from '@reading/shared';

import { apiFetch } from './client';

const notesKey = (entryId: string) => ['notes', entryId] as const;

export function useNotes(entryId: string) {
  return useQuery({
    queryKey: notesKey(entryId),
    queryFn: () => apiFetch<BookNote[]>(`/me/books/${entryId}/notes`),
  });
}

// Creates without a note id, edits with one
export function useSaveNote(entryId: string, noteId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NoteInput) =>
      apiFetch<BookNote>(
        noteId ? `/me/notes/${noteId}` : `/me/books/${entryId}/notes`,
        {
          method: noteId ? 'PATCH' : 'POST',
          body: JSON.stringify(input),
        },
      ),
    onSuccess: (saved) =>
      queryClient.setQueryData<BookNote[]>(notesKey(entryId), (notes = []) =>
        noteId
          ? notes.map((note) => (note.id === saved.id ? saved : note))
          : [saved, ...notes],
      ),
  });
}

export function useDeleteNote(entryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) =>
      apiFetch<void>(`/me/notes/${noteId}`, { method: 'DELETE' }),
    onSuccess: (_result, noteId) =>
      queryClient.setQueryData<BookNote[]>(notesKey(entryId), (notes) =>
        notes?.filter((note) => note.id !== noteId),
      ),
  });
}
