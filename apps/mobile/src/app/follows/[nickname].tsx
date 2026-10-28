import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Stack, useLocalSearchParams } from 'expo-router';

import { FlashList } from '@shopify/flash-list';

import type { FollowList } from '@reading/shared';

import { ReaderRow } from '@/components/profile/ReaderRow';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';

import { useFollowList } from '@/api/follows';
import { useColors } from '@/theme/ThemeProvider';

// readingapp://follows/alice?list=following
export default function FollowsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ nickname: string; list?: string }>();
  const [list, setList] = useState<FollowList>(
    params.list === 'following' ? 'following' : 'followers',
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: `@${params.nickname}` }} />

      <SegmentedControl
        options={[
          { value: 'followers', label: t('follows.followers') },
          { value: 'following', label: t('follows.followingTab') },
        ]}
        value={list}
        onChange={setList}
        className="mx-4 mb-2 mt-2"
      />

      {/* key: each tab is its own list, scrolled from the top */}
      <ReaderList key={list} nickname={params.nickname} list={list} />
    </Screen>
  );
}

function ReaderList({
  nickname,
  list,
}: {
  nickname: string;
  list: FollowList;
}) {
  const colors = useColors();

  const { t } = useTranslation();
  const {
    data,
    error,
    isPending,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useFollowList(nickname, list);

  if (isPending) {
    return <ActivityIndicator className="mt-8" color={colors.fg} />;
  }

  if (error) {
    return <Text className="mt-8 px-6 text-center">{error.message}</Text>;
  }

  return (
    <FlashList
      data={data.pages.flatMap((page) => page.items)}
      keyExtractor={(reader) => reader.id}
      renderItem={({ item }) => <ReaderRow reader={item} />}
      // Half a screen before the end: the next page is usually there in time
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      refreshing={isRefetching && !isFetchingNextPage}
      onRefresh={refetch}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      ListEmptyComponent={
        <Text variant="muted" className="mt-8 text-center">
          {t(`follows.empty.${list}`)}
        </Text>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-4">
            <ActivityIndicator color={colors.fg} />
          </View>
        ) : null
      }
    />
  );
}
