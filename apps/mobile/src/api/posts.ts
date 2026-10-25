import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';

import type {
  FeedKind,
  Page,
  PostComment,
  PostInput,
  PostItem,
} from '@reading/shared';

import { apiFetch } from './client';
import { uploadPostPhoto } from './uploads';

type PostPages = InfiniteData<Page<PostItem>, string | null>;
type CommentPages = InfiniteData<Page<PostComment>, string | null>;

// ['posts', 'feed', kind] and ['posts', 'detail', id]: invalidating
// ['posts'] refreshes both feeds and every open post
export const feedKey = (kind: FeedKind) => ['posts', 'feed', kind] as const;
export const postKey = (id: string) => ['posts', 'detail', id] as const;
export const commentsKey = (postId: string) => ['comments', postId] as const;

export function useFeed(kind: FeedKind) {
  return useInfiniteQuery({
    queryKey: feedKey(kind),
    queryFn: ({ pageParam }) =>
      apiFetch<Page<PostItem>>(
        `/posts?feed=${kind}` + (pageParam ? `&cursor=${pageParam}` : ''),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: postKey(id),
    queryFn: () => apiFetch<PostItem>(`/posts/${id}`),
  });
}

// One post can be in both feeds and on its own screen: change it everywhere
function updatePost(
  queryClient: QueryClient,
  id: string,
  update: (post: PostItem) => PostItem,
) {
  queryClient.setQueriesData<PostPages>(
    { queryKey: ['posts', 'feed'] },
    (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((post) =>
                post.id === id ? update(post) : post,
              ),
            })),
          }
        : data,
  );
  queryClient.setQueryData<PostItem>(
    postKey(id),
    (post) => post && update(post),
  );
}

export interface NewPost {
  text: string;
  bookId?: string;
  // A file on this phone; uploaded first
  localPhotoUri?: string;
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, bookId, localPhotoUri }: NewPost) => {
      const input: PostInput = {
        text,
        bookId,
        photoUrl: localPhotoUri
          ? await uploadPostPhoto(localPhotoUri)
          : undefined,
      };

      return apiFetch<PostItem>('/posts', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    // The new post goes to the top of both feeds
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useDeletePost(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<void>(`/posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: postKey(id) });
      queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] });
    },
  });
}

// Optimistic: the heart fills at once everywhere the post is shown
export function useTogglePostLike(post: PostItem) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (like: boolean) =>
      apiFetch<void>(`/posts/${post.id}/like`, {
        method: like ? 'PUT' : 'DELETE',
      }),
    onMutate: async (like) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      const previous = queryClient.getQueriesData({ queryKey: ['posts'] });

      updatePost(queryClient, post.id, (current) => ({
        ...current,
        likedByMe: like,
        likesCount: current.likesCount + (like ? 1 : -1),
      }));

      return { previous };
    },
    onError: (_error, _like, context) => {
      for (const [key, data] of context?.previous ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
  });
}

// After "+ Want to read" on a post's book card
export function markBookOnShelf(queryClient: QueryClient, bookId: string) {
  queryClient.setQueriesData<PostPages>(
    { queryKey: ['posts', 'feed'] },
    (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((post) =>
                post.book?.id === bookId
                  ? { ...post, book: { ...post.book, onMyShelf: true } }
                  : post,
              ),
            })),
          }
        : data,
  );
  queryClient.invalidateQueries({ queryKey: ['posts', 'detail'] });
}

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: commentsKey(postId),
    queryFn: ({ pageParam }) =>
      apiFetch<Page<PostComment>>(
        `/posts/${postId}/comments` + (pageParam ? `?cursor=${pageParam}` : ''),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) =>
      apiFetch<PostComment>(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey(postId) });
      // Comment count and "latest comment" on the post card
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useToggleCommentLike(postId: string) {
  const queryClient = useQueryClient();

  function setLike(commentId: string, like: boolean) {
    queryClient.setQueryData<CommentPages>(commentsKey(postId), (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((comment) =>
                comment.id === commentId
                  ? {
                      ...comment,
                      likedByMe: like,
                      likesCount: comment.likesCount + (like ? 1 : -1),
                    }
                  : comment,
              ),
            })),
          }
        : data,
    );
  }

  return useMutation({
    mutationFn: ({ commentId, like }: { commentId: string; like: boolean }) =>
      apiFetch<void>(`/comments/${commentId}/like`, {
        method: like ? 'PUT' : 'DELETE',
      }),
    onMutate: ({ commentId, like }) => setLike(commentId, like),
    onError: (_error, { commentId, like }) => setLike(commentId, !like),
  });
}
