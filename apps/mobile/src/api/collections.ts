import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CollectionDetail, CollectionInput } from '@reading/shared';

import { apiFetch } from './client';

export const collectionKey = (id: string) => ['collection', id] as const;

export function useCollection(id: string | undefined) {
  return useQuery({
    queryKey: collectionKey(id ?? ''),
    queryFn: () => apiFetch<CollectionDetail>(`/collections/${id}`),
    // The editor without an id is creating a new one: nothing to load
    enabled: id !== undefined,
  });
}

// Creates without an id, replaces the whole collection with one
export function useSaveCollection(id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CollectionInput) =>
      apiFetch<CollectionDetail>(
        id ? `/me/collections/${id}` : '/me/collections',
        { method: id ? 'PUT' : 'POST', body: JSON.stringify(input) },
      ),
    onSuccess: (saved) => {
      queryClient.setQueryData(collectionKey(saved.id), saved);
      // Profile cards: title, count, collage
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useDeleteCollection(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<void>(`/me/collections/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: collectionKey(id) });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// Optimistic, like following: the heart fills at once
export function useToggleLike(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (like: boolean) =>
      apiFetch<void>(`/collections/${id}/like`, {
        method: like ? 'PUT' : 'DELETE',
      }),
    onMutate: async (like) => {
      await queryClient.cancelQueries({ queryKey: collectionKey(id) });

      const previous = queryClient.getQueryData<CollectionDetail>(
        collectionKey(id),
      );

      queryClient.setQueryData<CollectionDetail>(
        collectionKey(id),
        (collection) =>
          collection && {
            ...collection,
            isLiked: like,
            likesCount: collection.likesCount + (like ? 1 : -1),
          },
      );

      return { previous };
    },
    onError: (_error, _like, context) => {
      queryClient.setQueryData(collectionKey(id), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: collectionKey(id) });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
