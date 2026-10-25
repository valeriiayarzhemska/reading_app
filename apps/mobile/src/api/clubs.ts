import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type { ClubDetail, ClubInput, ClubSummary } from '@reading/shared';

import { apiFetch } from './client';

export const clubKey = (id: string) => ['clubs', 'detail', id] as const;

// ['clubs', …]: invalidating ['clubs'] refreshes every list and detail
export function useMyClubs() {
  return useQuery({
    queryKey: ['clubs', 'mine'],
    queryFn: () => apiFetch<ClubSummary[]>('/clubs/mine'),
  });
}

export function useAllClubs(query: string) {
  return useQuery({
    queryKey: ['clubs', 'all', query],
    queryFn: () =>
      apiFetch<ClubSummary[]>(
        query ? `/clubs?query=${encodeURIComponent(query)}` : '/clubs',
      ),
    // While a new search loads, keep showing the previous results
    placeholderData: keepPreviousData,
  });
}

export function useClub(id: string) {
  return useQuery({
    queryKey: clubKey(id),
    queryFn: () => apiFetch<ClubDetail>(`/clubs/${id}`),
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ClubInput) =>
      apiFetch<ClubDetail>('/clubs', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (club) => {
      queryClient.setQueryData(clubKey(club.id), club);
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export function useJoinClub(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<void>(`/clubs/${id}/membership`, { method: 'PUT' }),
    // Member counts and "member" flags change in every list
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clubs'] }),
  });
}
