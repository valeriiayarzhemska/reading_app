import { useQuery } from '@tanstack/react-query';

import type { Achievement } from '@reading/shared';

import { apiFetch } from './client';

// The server checks your badges on each request: a badge earned a minute
// ago shows up the next time this is fetched
export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: () => apiFetch<Achievement[]>('/me/achievements'),
  });
}
