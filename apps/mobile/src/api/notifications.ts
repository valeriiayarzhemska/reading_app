import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type { NotificationItem, Page } from '@reading/shared';

import { apiFetch } from './client';

// ['notifications', …]: one invalidation refreshes the badge and the list
const countKey = ['notifications', 'count'] as const;
const listKey = ['notifications', 'list'] as const;

export function useUnreadCount() {
  return useQuery({
    queryKey: countKey,
    queryFn: () => apiFetch<{ count: number }>('/notifications/unread-count'),
    select: (data) => data.count,
  });
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: listKey,
    queryFn: ({ pageParam }) =>
      apiFetch<Page<NotificationItem>>(
        '/notifications' + (pageParam ? `?cursor=${pageParam}` : ''),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<void>('/notifications/read', { method: 'POST' }),
    // The badge goes at once; the list keeps its highlights until reopened
    onSuccess: () => queryClient.setQueryData(countKey, { count: 0 }),
  });
}
