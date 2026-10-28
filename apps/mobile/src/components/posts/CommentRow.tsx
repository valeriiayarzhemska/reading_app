import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ReportTarget, type PostComment } from '@reading/shared';

import { useReport } from '@/components/reports/ReportProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';

import { useAuth } from '@/auth/AuthContext';
import { timeAgo } from '@/lib/timeAgo';
import { useColors } from '@/theme/ThemeProvider';

interface CommentRowProps {
  comment: PostComment;
  now: number;
  onLike: (comment: PostComment) => void;
  onReply: (comment: PostComment) => void;
  // Your own comments only
  onDelete: (comment: PostComment) => void;
}

export function CommentRow({
  comment,
  now,
  onLike,
  onReply,
  onDelete,
}: CommentRowProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const { state } = useAuth();
  const report = useReport();
  const isMine =
    state.status === 'signedIn' && state.user.id === comment.author.id;

  function confirmDelete() {
    Alert.alert(t('posts.deleteCommentTitle'), undefined, [
      { text: t('book.cancel'), style: 'cancel' },
      {
        text: t('posts.deleteComment'),
        style: 'destructive',
        onPress: () => onDelete(comment),
      },
    ]);
  }

  return (
    <View className="gap-2 border-b border-border px-4 py-3">
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/user/[nickname]',
            params: { nickname: comment.author.nickname },
          })
        }
        className="flex-row items-center gap-2.5 active:opacity-70"
      >
        <Avatar
          name={comment.author.displayName}
          url={comment.author.avatarUrl}
          size={32}
        />

        <Text className="flex-1 font-sans-semibold" numberOfLines={1}>
          {comment.author.displayName}
        </Text>

        <Text variant="muted" className="text-sm">
          {t('time.ago', { time: timeAgo(comment.createdAt, now, t) })}
        </Text>
      </Pressable>

      <Text>{comment.text}</Text>

      <View className="flex-row items-center gap-5">
        <Pressable
          onPress={() => onLike(comment)}
          accessibilityRole="button"
          accessibilityState={{ selected: comment.likedByMe }}
          accessibilityLabel={t('posts.like')}
          hitSlop={6}
          className="flex-row items-center gap-1 active:opacity-60"
        >
          <Feather
            name="heart"
            size={16}
            color={comment.likedByMe ? colors.accent : colors.fgFaint}
          />

          {comment.likesCount > 0 ? (
            <Text variant="muted" className="text-xs">
              {comment.likesCount}
            </Text>
          ) : null}
        </Pressable>

        <Pressable
          onPress={() => onReply(comment)}
          accessibilityRole="button"
          accessibilityLabel={t('chat.reply')}
          hitSlop={6}
          className="active:opacity-60"
        >
          <Feather name="corner-up-left" size={16} color={colors.fgFaint} />
        </Pressable>

        {/* Yours: delete. Someone else's: report. */}
        <Pressable
          onPress={
            isMine
              ? confirmDelete
              : () => report(ReportTarget.COMMENT, comment.id)
          }
          accessibilityRole="button"
          accessibilityLabel={t(
            isMine ? 'posts.deleteComment' : 'report.title',
          )}
          hitSlop={6}
          className="ml-auto active:opacity-60"
        >
          <Feather
            name={isMine ? 'trash-2' : 'flag'}
            size={14}
            color={colors.fgFaint}
          />
        </Pressable>
      </View>
    </View>
  );
}
