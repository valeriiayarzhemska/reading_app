import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import type {
  FollowList,
  Page,
  PublicProfile,
  ReaderSummary,
} from '@reading/shared';

import { apiFetch } from './client';
import { profileKey } from './users';

type FollowPages = InfiniteData<Page<ReaderSummary>, string | null>;

export const followListKey = (nickname: string, list: FollowList) =>
  ['follows', nickname.toLowerCase(), list] as const;

// Pages are stored side by side in data.pages; fetchNextPage() asks for the
// next one with the last page's nextCursor
export function useFollowList(nickname: string, list: FollowList) {
  return useInfiniteQuery({
    queryKey: followListKey(nickname, list),
    queryFn: ({ pageParam }) =>
      apiFetch<Page<ReaderSummary>>(
        `/users/${encodeURIComponent(nickname)}/${list}` +
          (pageParam ? `?cursor=${pageParam}` : ''),
      ),
    initialPageParam: null as string | null,
    // null: no more pages, hasNextPage becomes false
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

interface FollowChange {
  nickname: string;
  follow: boolean;
}

// Optimistic: the button and the count change at once, before the server
// answers, and are put back if the request fails
export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nickname, follow }: FollowChange) =>
      apiFetch<void>(`/users/${encodeURIComponent(nickname)}/follow`, {
        method: follow ? 'PUT' : 'DELETE',
      }),
    onMutate: async ({ nickname, follow }) => {
      // A response already on its way would overwrite the optimistic values
      await queryClient.cancelQueries({ queryKey: profileKey(nickname) });
      await queryClient.cancelQueries({ queryKey: ['follows'] });

      const previousProfile = queryClient.getQueryData<PublicProfile>(
        profileKey(nickname),
      );
      const previousLists = queryClient.getQueriesData<FollowPages>({
        queryKey: ['follows'],
      });

      queryClient.setQueryData<PublicProfile>(
        profileKey(nickname),
        (profile) =>
          profile && {
            ...profile,
            isFollowing: follow,
            followersCount: profile.followersCount + (follow ? 1 : -1),
          },
      );

      // The same reader can be a row in several loaded lists
      queryClient.setQueriesData<FollowPages>(
        { queryKey: ['follows'] },
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((reader) =>
                reader.nickname === nickname
                  ? { ...reader, isFollowing: follow }
                  : reader,
              ),
            })),
          },
      );

      // Handed to onError as its third argument
      return { previousProfile, previousLists };
    },
    onError: (_error, { nickname }, context) => {
      queryClient.setQueryData(profileKey(nickname), context?.previousProfile);

      for (const [key, data] of context?.previousLists ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    // Real counts from the server, for this profile and your own. Lists are
    // not refetched: an unfollowed row stays (with Follow) until you reopen
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}
