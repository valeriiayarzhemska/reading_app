import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import { FlashList } from '@shopify/flash-list';

import { NotificationType, type NotificationItem } from '@reading/shared';

import { Avatar } from '@/components/ui/Avatar';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import {
  useMarkNotificationsRead,
  useNotifications,
} from '@/api/notifications';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/timeAgo';
import { useColors } from '@/theme/ThemeProvider';

const ACTION_KEYS = {
  [NotificationType.FOLLOW]: 'notifications.follow',
  [NotificationType.POST_LIKE]: 'notifications.postLike',
  [NotificationType.POST_COMMENT]: 'notifications.postComment',
  [NotificationType.COMMENT_LIKE]: 'notifications.commentLike',
} as const;

function open(item: NotificationItem) {
  if (item.postId) {
    router.push({ pathname: '/posts/[id]', params: { id: item.postId } });

    return;
  }

  router.push({
    pathname: '/user/[nickname]',
    params: { nickname: item.actor.nickname },
  });
}

export default function NotificationsScreen() {
  const colors = useColors();

  const { t } = useTranslation();
  const list = useNotifications();
  const markRead = useMarkNotificationsRead();
  // Read once: render must not read the clock
  const [now] = useState(Date.now);
  const hasMarked = useRef(false);

  // After the list has loaded, so this visit still shows which ones are new
  useEffect(() => {
    if (list.isSuccess && !hasMarked.current) {
      hasMarked.current = true;
      markRead.mutate();
    }
  }, [list.isSuccess, markRead]);

  if (list.isPending) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.fg} />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlashList
        data={list.data?.pages.flatMap((page) => page.items) ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item)}
            className={cn(
              'flex-row items-start gap-3 px-4 py-3 active:opacity-70',
              !item.isRead && 'bg-accent/10',
            )}
          >
            <Avatar
              name={item.actor.displayName}
              url={item.actor.avatarUrl}
              size={40}
            />

            <View className="flex-1 gap-0.5">
              <Text>
                <Text className="font-sans-semibold">
                  {item.actor.nickname}
                </Text>{' '}
                {t(ACTION_KEYS[item.type])}
              </Text>

              {item.preview ? (
                <Text variant="muted" className="text-sm" numberOfLines={1}>
                  {item.preview}
                </Text>
              ) : null}

              <Text variant="muted" className="text-xs">
                {timeAgo(item.createdAt, now, t)}
              </Text>
            </View>

            {item.isRead ? null : (
              <View className="mt-2 h-2 w-2 rounded-full bg-accent" />
            )}
          </Pressable>
        )}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) {
            void list.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshing={list.isRefetching && !list.isFetchingNextPage}
        onRefresh={() => void list.refetch()}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          <Text variant="muted" className="mt-10 px-8 text-center">
            {t('notifications.empty')}
          </Text>
        }
      />
    </Screen>
  );
}
