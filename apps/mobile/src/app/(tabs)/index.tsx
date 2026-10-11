import { ShelfStatus, type UserBookWithBook } from '@reading/shared';
import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, SectionList, View } from 'react-native';
import { useShelf } from '@/api/shelf';
import { BookRow } from '@/components/book-row';
import { useTabBarInset } from '@/components/tab-bar';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { currentLanguage } from '@/i18n';
import { formatDate } from '@/lib/format';
import { COLORS } from '@/theme/colors';

const SECTION_ORDER = [
  ShelfStatus.READING,
  ShelfStatus.WANT_TO_READ,
  ShelfStatus.READ,
  ShelfStatus.ABANDONED,
];

function toSections(books: UserBookWithBook[], t: TFunction) {
  return SECTION_ORDER.map((status) => ({
    title: t(`library.sections.${status}`),
    data: books.filter((userBook) => userBook.status === status),
  })).filter((section) => section.data.length > 0);
}

function progressLabel(
  userBook: UserBookWithBook,
  t: TFunction,
): string | undefined {
  if (userBook.status !== ShelfStatus.READING) {
    return undefined;
  }

  const progress =
    userBook.progressUnit === 'PERCENT'
      ? `${userBook.currentProgress}%`
      : userBook.book.pageCount
        ? t('library.progressPage', {
            current: userBook.currentProgress,
            total: userBook.book.pageCount,
          })
        : t('library.progressPageUnknownTotal', {
            current: userBook.currentProgress,
          });

  if (!userBook.startedAt) {
    return progress;
  }

  const started = t('library.startedOn', {
    date: formatDate(userBook.startedAt, currentLanguage()),
  });

  return `${progress} · ${started}`;
}

export default function LibraryScreen() {
  const { t } = useTranslation();
  const { data, isPending, error, refetch, isRefetching } = useShelf();
  const tabBarInset = useTabBarInset();

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

  return (
    <Screen edges={['top']}>
      <SectionList
        sections={toSections(data, t)}
        keyExtractor={(userBook) => userBook.id}
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingBottom: tabBarInset }}
        stickySectionHeadersEnabled={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <View className="gap-4 pt-2">
            <View className="gap-1">
              <Text variant="title">{t('library.title')}</Text>

              <Text variant="muted">
                {t('library.bookCount', { count: data.length })}
              </Text>
            </View>

            <Button
              title={t('library.addBook')}
              onPress={() => router.push('/search')}
            />
          </View>
        }
        ListEmptyComponent={
          <Text variant="muted" className="mt-6 text-center">
            {t('library.empty')}
          </Text>
        }
        renderSectionHeader={({ section }) => (
          <Text variant="label" className="mb-1 mt-6">
            {section.title} · {section.data.length}
          </Text>
        )}
        renderItem={({ item }) => (
          <BookRow
            title={item.book.title}
            authors={item.book.authors}
            coverUrl={item.book.coverUrl}
            subtitle={progressLabel(item, t)}
          />
        )}
      />
    </Screen>
  );
}
