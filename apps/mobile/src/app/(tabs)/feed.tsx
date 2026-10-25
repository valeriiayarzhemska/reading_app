import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { FlashList } from '@shopify/flash-list';

import type { FeedKind } from '@reading/shared';

import { PostCard } from '@/components/posts/PostCard';
import { useTabBarInset } from '@/components/TabBar';
import { Chips } from '@/components/ui/Chips';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { useFeed } from '@/api/posts';
import { COLORS } from '@/theme/colors';

export default function ShelvesScreen() {
  const { t } = useTranslation();
  const tabBarInset = useTabBarInset();
  const [kind, setKind] = useState<FeedKind>('following');

  return (
    <Screen edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-2">
        <Text variant="title" className="flex-1">
          {t('tabs.feed')}
        </Text>

        <IconButton
          icon="search"
          label={t('search.title')}
          onPress={() =>
            router.push({ pathname: '/search', params: { mode: 'readers' } })
          }
        />
      </View>

      <Chips
        options={[
          { value: 'following', label: t('posts.following') },
          { value: 'all', label: t('posts.all') },
        ]}
        value={kind}
        onChange={setKind}
        className="px-4 pb-2"
      />

      {/* key: each feed keeps its own scroll position */}
      <Feed key={kind} kind={kind} bottomInset={tabBarInset} />

      <Pressable
        onPress={() => router.push('/post-new')}
        accessibilityRole="button"
        accessibilityLabel={t('posts.new')}
        className="absolute right-5 h-16 w-16 items-center justify-center rounded-full bg-accent active:opacity-80"
        // Above the floating tab bar
        style={{ bottom: tabBarInset + 8 }}
      >
        <Feather name="plus" size={28} color={COLORS.accentFg} />
      </Pressable>
    </Screen>
  );
}

function Feed({ kind, bottomInset }: { kind: FeedKind; bottomInset: number }) {
  const { t } = useTranslation();
  const feed = useFeed(kind);
  // Read once (and on refresh): "4 min" labels without reading the clock
  // during render
  const [now, setNow] = useState(Date.now);

  if (feed.isPending) {
    return <ActivityIndicator className="mt-8" color={COLORS.fg} />;
  }

  if (feed.error) {
    return <Text className="mt-8 px-6 text-center">{feed.error.message}</Text>;
  }

  return (
    <FlashList
      data={feed.data.pages.flatMap((page) => page.items)}
      keyExtractor={(post) => post.id}
      renderItem={({ item }) => (
        <PostCard post={item} now={now} variant="feed" />
      )}
      onEndReached={() => {
        if (feed.hasNextPage && !feed.isFetchingNextPage) {
          void feed.fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      refreshing={feed.isRefetching && !feed.isFetchingNextPage}
      onRefresh={() => {
        setNow(Date.now());
        void feed.refetch();
      }}
      // Room for the tab bar and the + button
      contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
      ListEmptyComponent={
        <Text variant="muted" className="mt-10 px-8 text-center">
          {t(kind === 'following' ? 'posts.emptyFollowing' : 'posts.emptyAll')}
        </Text>
      }
      ListFooterComponent={
        feed.isFetchingNextPage ? (
          <ActivityIndicator className="py-4" color={COLORS.fg} />
        ) : null
      }
    />
  );
}
