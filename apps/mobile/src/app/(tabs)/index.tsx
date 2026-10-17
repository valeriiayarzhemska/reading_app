import { Feather } from '@expo/vector-icons';
import { ShelfStatus } from '@reading/shared';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useShelf } from '@/api/shelf';
import { useAuth } from '@/auth/auth-context';
import { CurrentReadingCard } from '@/components/library/current-reading-card';
import { InProgressRow } from '@/components/library/in-progress-row';
import { ShelfTile } from '@/components/library/shelf-tile';
import { useTabBarInset } from '@/components/tab-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { toLibrarySections } from '@/library/shelves';
import { COLORS } from '@/theme/colors';
import { usePendingCount } from '@/timer/pending-sessions';

export default function LibraryScreen() {
  const { t } = useTranslation();
  const { data, isPending, error, refetch, isRefetching } = useShelf();
  const tabBarInset = useTabBarInset();
  const { state } = useAuth();
  const pendingCount = usePendingCount(
    state.status === 'signedIn' ? state.user.id : null,
  );

  if (isPending) {
    return (
      <Screen edges={['top']} className="items-center justify-center">
        <ActivityIndicator color={COLORS.fg} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen
        edges={['top']}
        className="items-center justify-center gap-3 px-6"
      >
        <Text className="text-center">
          {t('library.loadError', { message: error.message })}
        </Text>

        <Button
          title={t('common.retry')}
          variant="secondary"
          onPress={() => refetch()}
        />
      </Screen>
    );
  }

  const sections = toLibrarySections(data);
  const nextToRead = sections.wantToRead[0]?.book.title;

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-6 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: tabBarInset }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.fg}
          />
        }
      >
        <View className="flex-row items-end justify-between">
          <View className="gap-1">
            <Text variant="label">
              {t('library.bookCount', { count: data.length })}
            </Text>

            <Text variant="title">{t('library.title')}</Text>
          </View>

          <Pressable
            onPress={() => router.push('/search')}
            accessibilityRole="button"
            accessibilityLabel={t('search.title')}
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-card active:opacity-70"
          >
            <Feather name="search" size={20} color={COLORS.fg} />
          </Pressable>
        </View>

        {pendingCount > 0 ? (
          <View className="flex-row items-center gap-2">
            <Feather name="cloud-off" size={14} color={COLORS.fgMuted} />

            <Text variant="muted" className="text-xs">
              {t('timer.pending', { count: pendingCount })}
            </Text>
          </View>
        ) : null}

        {data.length === 0 ? (
          <Card className="gap-4">
            <Text variant="heading">{t('library.emptyTitle')}</Text>

            <Text variant="muted">{t('library.empty')}</Text>

            <Button
              title={t('library.addBook')}
              onPress={() => router.push('/search')}
            />
          </Card>
        ) : null}

        {sections.current ? (
          <CurrentReadingCard entry={sections.current} />
        ) : null}

        {sections.inProgress.length > 0 ? (
          <InProgressRow entries={sections.inProgress} />
        ) : null}

        {data.length > 0 ? (
          <View className="flex-row gap-3">
            <ShelfTile
              count={sections.wantToRead.length}
              label={t('library.tiles.want')}
              footer={
                nextToRead
                  ? t('library.tiles.next', { title: nextToRead })
                  : undefined
              }
              entries={sections.wantToRead}
              onPress={() =>
                router.push({
                  pathname: '/shelf/[status]',
                  params: { status: ShelfStatus.WANT_TO_READ },
                })
              }
            />

            <ShelfTile
              count={sections.read.length}
              label={t('library.tiles.read')}
              footer={t('library.tiles.thisYear', {
                count: sections.readThisYear,
              })}
              entries={sections.read}
              onPress={() =>
                router.push({
                  pathname: '/shelf/[status]',
                  params: { status: ShelfStatus.READ },
                })
              }
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
