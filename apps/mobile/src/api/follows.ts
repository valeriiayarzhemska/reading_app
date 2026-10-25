import {
  useInfiniteQuery,
  useMutation,
  useQuery,
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

// ['readers', 'search', query]: the Readers tab of Search
export function useReaderSearch(query: string) {
  return useQuery({
    queryKey: ['readers', 'search', query],
    queryFn: () =>
      apiFetch<ReaderSummary[]>(
        `/users/search?query=${encodeURIComponent(query)}`,
      ),
    enabled: query.length >= 2,
  });
}

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
      await queryClient.cancelQueries({ queryKey: ['readers'] });

      const previousProfile = queryClient.getQueryData<PublicProfile>(
        profileKey(nickname),
      );
      const previousLists = queryClient.getQueriesData<FollowPages>({
        queryKey: ['follows'],
      });
      const previousSearches = queryClient.getQueriesData<ReaderSummary[]>({
        queryKey: ['readers'],
      });
      const withFollow = (reader: ReaderSummary) =>
        reader.nickname === nickname
          ? { ...reader, isFollowing: follow }
          : reader;

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
              items: page.items.map(withFollow),
            })),
          },
      );

      queryClient.setQueriesData<ReaderSummary[]>(
        { queryKey: ['readers'] },
        (readers) => readers?.map(withFollow),
      );

      // Handed to onError as its third argument
      return { previousProfile, previousLists, previousSearches };
    },
    onError: (_error, { nickname }, context) => {
      queryClient.setQueryData(profileKey(nickname), context?.previousProfile);

      for (const [key, data] of [
        ...(context?.previousLists ?? []),
        ...(context?.previousSearches ?? []),
      ]) {
        queryClient.setQueryData(key, data);
      }
    },
    // Real counts from the server, for this profile and your own. Lists are
    // not refetched: an unfollowed row stays (with Follow) until you reopen
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}
