import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useQueryClient } from '@tanstack/react-query';

import { ReportTarget, type PostItem } from '@reading/shared';

import { QuoteCard } from '@/components/quotes/QuoteCard';
import { useReport } from '@/components/reports/ReportProvider';
import { Avatar } from '@/components/ui/Avatar';
import { BookCover } from '@/components/ui/BookCover';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { Text } from '@/components/ui/Text';

import { markBookOnShelf, useDeletePost, useTogglePostLike } from '@/api/posts';
import { useAddBookToShelf } from '@/api/reviews';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/timeAgo';
import { useColors } from '@/theme/ThemeProvider';

interface PostCardProps {
  post: PostItem;
  // Read once by the screen: render must not read the clock
  now: number;
  // In the feed: tapping opens the post; on its own screen: no latest comment
  variant: 'feed' | 'detail';
}

export function PostCard({ post, now, variant }: PostCardProps) {
  const colors = useColors();

  const { t } = useTranslation();
  const toggleLike = useTogglePostLike(post);
  const remove = useDeletePost(post.id);
  const report = useReport();

  function open() {
    router.push({ pathname: '/posts/[id]', params: { id: post.id } });
  }

  function openAuthor() {
    router.push({
      pathname: '/user/[nickname]',
      params: { nickname: post.author.nickname },
    });
  }

  function confirmDelete() {
    Alert.alert(t('posts.deleteTitle'), t('posts.deleteMessage'), [
      { text: t('book.cancel'), style: 'cancel' },
      {
        text: t('posts.delete'),
        style: 'destructive',
        onPress: () =>
          remove.mutate(undefined, {
            onSuccess: variant === 'detail' ? () => router.back() : undefined,
          }),
      },
    ]);
  }

  return (
    <View className="flex-row gap-3 border-b border-border px-4 py-4">
      <Pressable onPress={openAuthor} className="active:opacity-70">
        <Avatar
          name={post.author.displayName}
          url={post.author.avatarUrl}
          size={44}
        />
      </Pressable>

      <View className="flex-1 gap-3">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={openAuthor} className="flex-1 active:opacity-70">
            <Text className="font-sans-semibold" numberOfLines={1}>
              {post.author.nickname}
            </Text>
          </Pressable>

          <Text variant="muted" className="text-sm">
            {timeAgo(post.createdAt, now, t)}
          </Text>

          {/* Report for others' posts comes with the Report story */}
          {/* Yours: delete. Someone else's: report. */}
          <Pressable
            onPress={
              post.isMine
                ? confirmDelete
                : () => report(ReportTarget.POST, post.id)
            }
            accessibilityRole="button"
            accessibilityLabel={t(
              post.isMine ? 'posts.delete' : 'report.title',
            )}
            hitSlop={8}
            className="active:opacity-60"
          >
            <Feather name="more-horizontal" size={18} color={colors.fgFaint} />
          </Pressable>
        </View>

        <Pressable
          onPress={variant === 'feed' ? open : undefined}
          disabled={variant !== 'feed'}
          className="gap-3"
        >
          {post.text ? <Text className="text-base">{post.text}</Text> : null}

          {/* A shared quote names its book itself: no separate book card */}
          {post.quote && post.book ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/books/[bookId]',
                  params: { bookId: post.book?.id ?? '' },
                })
              }
              className="active:opacity-80"
            >
              <QuoteCard
                text={post.quote.text}
                page={post.quote.page}
                bookTitle={post.book.title}
              />
            </Pressable>
          ) : post.book ? (
            <PostBookCard book={post.book} />
          ) : null}

          {post.photoUrl ? (
            <RemoteImage
              uri={post.photoUrl}
              style={{ width: '100%', aspectRatio: 4 / 5, borderRadius: 16 }}
              accessibilityLabel={t('chat.photo')}
            />
          ) : null}
        </Pressable>

        <View className="flex-row items-center gap-5">
          <Pressable
            onPress={() => toggleLike.mutate(!post.likedByMe)}
            accessibilityRole="button"
            accessibilityState={{ selected: post.likedByMe }}
            accessibilityLabel={t('posts.like')}
            hitSlop={6}
            className="flex-row items-center gap-1.5 active:opacity-60"
          >
            <Feather
              name="heart"
              size={20}
              color={post.likedByMe ? colors.accent : colors.fgMuted}
            />

            {post.likesCount > 0 ? (
              <Text variant="muted">{post.likesCount}</Text>
            ) : null}
          </Pressable>

          <Pressable
            onPress={open}
            accessibilityRole="button"
            accessibilityLabel={t('posts.comments')}
            hitSlop={6}
            className="flex-row items-center gap-1.5 active:opacity-60"
          >
            <Feather name="message-circle" size={20} color={colors.fgMuted} />

            {post.commentsCount > 0 ? (
              <Text variant="muted">{post.commentsCount}</Text>
            ) : null}
          </Pressable>
        </View>

        {variant === 'feed' && post.latestComment ? (
          <Pressable onPress={open} className="active:opacity-70">
            <Text numberOfLines={2} className="text-sm">
              <Text className="font-sans-semibold text-sm">
                {post.latestComment.authorNickname}
              </Text>{' '}
              <Text variant="muted" className="text-sm">
                {post.latestComment.text}
              </Text>
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// The attached book, with "+ Want to read" unless it's on your shelf
function PostBookCard({ book }: { book: NonNullable<PostItem['book']> }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const add = useAddBookToShelf(book.id);

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/books/[bookId]',
          params: { bookId: book.id },
        })
      }
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3 active:opacity-70"
    >
      <BookCover uri={book.coverUrl} title={book.title} size="sm" />

      <View className="flex-1 gap-0.5">
        <Text className="font-serif text-base" numberOfLines={2}>
          {book.title}
        </Text>

        <Text variant="muted" className="text-xs" numberOfLines={1}>
          {book.authors.join(', ')}
        </Text>
      </View>

      {book.onMyShelf ? (
        <Text className="font-sans-semibold text-sm text-accent">
          {t('search.onShelf')}
        </Text>
      ) : (
        <Pressable
          onPress={() =>
            add.mutate(undefined, {
              onSuccess: () => markBookOnShelf(queryClient, book.id),
            })
          }
          disabled={add.isPending}
          className={cn(
            'rounded-full border border-accent px-3 py-1.5 active:opacity-70',
            add.isPending && 'opacity-50',
          )}
        >
          <Text className="font-sans-semibold text-sm text-accent">
            {t('posts.wantToRead')}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}
