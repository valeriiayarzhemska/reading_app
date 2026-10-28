import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { FlashList } from '@shopify/flash-list';

import { COMMENT_MAX_LENGTH, type PostItem } from '@reading/shared';

import { CommentRow } from '@/components/posts/CommentRow';
import { PostCard } from '@/components/posts/PostCard';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import {
  useAddComment,
  useComments,
  usePost,
  useToggleCommentLike,
} from '@/api/posts';
import { cn } from '@/lib/cn';
import { useColors, useTheme } from '@/theme/ThemeProvider';

// readingapp://posts/<id>
export default function PostScreen() {
  const colors = useColors();

  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = usePost(id);

  return (
    <Screen edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-3 px-4 pb-2">
        <IconButton
          icon="chevron-left"
          label={t('chat.back')}
          onPress={() => router.back()}
        />

        <Text variant="label">{t('posts.title')}</Text>
      </View>

      {post.data ? (
        <Comments post={post.data} />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          {post.error ? (
            <Text className="text-center">{post.error.message}</Text>
          ) : (
            <ActivityIndicator color={colors.fg} />
          )}
        </View>
      )}
    </Screen>
  );
}

function Comments({ post }: { post: PostItem }) {
  const colors = useColors();
  const { scheme } = useTheme();

  const { t } = useTranslation();
  const comments = useComments(post.id);
  const addComment = useAddComment(post.id);
  const toggleLike = useToggleCommentLike(post.id);
  const [text, setText] = useState('');
  // Read once: render must not read the clock
  const [now] = useState(Date.now);
  const canSend = text.trim() !== '' && !addComment.isPending;

  function send() {
    addComment.mutate(text.trim(), { onSuccess: () => setText('') });
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlashList
        data={comments.data?.pages.flatMap((page) => page.items) ?? []}
        keyExtractor={(comment) => comment.id}
        renderItem={({ item }) => (
          <CommentRow
            comment={item}
            now={now}
            onLike={(comment) =>
              toggleLike.mutate({
                commentId: comment.id,
                like: !comment.likedByMe,
              })
            }
            // No nested threads: a reply is a comment that names its person
            onReply={(comment) => setText(`@${comment.author.nickname} `)}
          />
        )}
        onEndReached={() => {
          if (comments.hasNextPage && !comments.isFetchingNextPage) {
            void comments.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <PostCard post={post} now={now} variant="detail" />
        }
        ListEmptyComponent={
          comments.isPending ? (
            <ActivityIndicator className="mt-6" color={colors.fg} />
          ) : (
            <Text variant="muted" className="mt-6 text-center">
              {t('posts.noComments')}
            </Text>
          )
        }
      />

      {addComment.error ? (
        <Text className="px-4 text-danger">{addComment.error.message}</Text>
      ) : null}

      <View className="flex-row items-end gap-2 px-4 pb-2 pt-2">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('posts.replyPlaceholder')}
          placeholderTextColor={colors.fgFaint}
          selectionColor={colors.accent}
          keyboardAppearance={scheme}
          multiline
          maxLength={COMMENT_MAX_LENGTH}
          className="max-h-32 flex-1 rounded-3xl border border-border bg-card px-4 py-3 font-sans text-base text-fg"
        />

        <Pressable
          onPress={send}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
          className={cn(
            'h-12 w-12 items-center justify-center rounded-full active:opacity-70',
            canSend ? 'bg-accent' : 'bg-card',
          )}
        >
          <Feather
            name="arrow-up"
            size={22}
            color={canSend ? colors.accentFg : colors.fgFaint}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
