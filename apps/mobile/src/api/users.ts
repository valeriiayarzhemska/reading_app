import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  nicknameError,
  type FavoriteBook,
  type Me,
  type NicknameAvailability,
  type PublicProfile,
} from '@reading/shared';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { apiFetch } from './client';

function fetchNicknameAvailability(nickname: string) {
  return apiFetch<NicknameAvailability>(
    `/users/nickname-available?nickname=${encodeURIComponent(nickname)}`,
  );
}

export function completeOnboarding(body: {
  displayName: string;
  nickname: string;
}) {
  return apiFetch<Me>('/me/onboarding', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export interface ProfileChanges {
  displayName?: string;
  nickname?: string;
  bio?: string;
  links?: string[];
  timezone?: string;
}

export function updateProfile(changes: ProfileChanges) {
  return apiFetch<Me>('/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

// Asks the server only for nicknames that pass the local format check, and
// only once typing pauses
export function useNicknameAvailability(nickname: string) {
  const debounced = useDebouncedValue(nickname, 400);
  const query = useQuery({
    queryKey: ['nickname-available', debounced],
    queryFn: () => fetchNicknameAvailability(debounced),
    enabled: nicknameError(debounced) === null,
  });
  const isChecking =
    nicknameError(nickname) === null &&
    (debounced !== nickname || query.isFetching);

  return {
    isChecking,
    available: !isChecking && query.data?.available === true,
    taken: !isChecking && query.data?.available === false,
  };
}

// ['profile', nickname]; invalidating ['profile'] refreshes every loaded one
export const profileKey = (nickname: string) =>
  ['profile', nickname.toLowerCase()] as const;

export function usePublicProfile(nickname: string) {
  return useQuery({
    queryKey: profileKey(nickname),
    queryFn: () =>
      apiFetch<PublicProfile>(`/users/${encodeURIComponent(nickname)}`),
  });
}

export function useSetFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userBookIds: string[]) =>
      apiFetch<FavoriteBook[]>('/me/favorites', {
        method: 'PUT',
        body: JSON.stringify({ userBookIds }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}
