import { ShelfStatus, type UserBookWithBook } from '@reading/shared';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, SectionList, View } from 'react-native';
import { useShelf } from '@/api/shelf';
import { BookRow } from '@/components/book-row';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { COLORS } from '@/theme/colors';

const SECTION_TITLES: Record<ShelfStatus, string> = {
  READING: 'Reading now',
  WANT_TO_READ: 'Want to read',
  READ: 'Read',
  ABANDONED: 'Abandoned',
};

const SECTION_ORDER = [
  ShelfStatus.READING,
  ShelfStatus.WANT_TO_READ,
  ShelfStatus.READ,
  ShelfStatus.ABANDONED,
];

function toSections(books: UserBookWithBook[]) {
  return SECTION_ORDER.map((status) => ({
    title: SECTION_TITLES[status],
    data: books.filter((userBook) => userBook.status === status),
  })).filter((section) => section.data.length > 0);
}

function progressLabel(userBook: UserBookWithBook): string | undefined {
  if (userBook.status !== ShelfStatus.READING) {
    return undefined;
  }

  if (userBook.progressUnit === 'PERCENT') {
    return `${userBook.currentProgress}%`;
  }

  const total = userBook.book.pageCount;

  return total
    ? `page ${userBook.currentProgress} of ${total}`
    : `page ${userBook.currentProgress}`;
}

function DesignLink() {
  return (
    <Pressable
      onPress={() => router.push('/design')}
      className="mt-8 items-center py-2"
    >
      <Text variant="label">Design system →</Text>
    </Pressable>
  );
}

export default function ShelfScreen() {
  const { data, isPending, error, refetch, isRefetching } = useShelf();

  if (isPending) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={COLORS.fg} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen className="items-center justify-center gap-3 px-6">
        <Text className="text-center">
          Could not load your shelf: {error.message}
        </Text>
        <Button title="Retry" variant="secondary" onPress={() => refetch()} />
        {__DEV__ ? <DesignLink /> : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionList
        sections={toSections(data)}
        keyExtractor={(userBook) => userBook.id}
        contentContainerClassName="px-4 pb-8"
        stickySectionHeadersEnabled={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <View className="gap-4 pt-2">
            <Text variant="title">Library</Text>
            <Button
              title="+ Add a book"
              onPress={() => router.push('/search')}
            />
          </View>
        }
        ListFooterComponent={__DEV__ ? <DesignLink /> : null}
        ListEmptyComponent={
          <Text variant="muted" className="mt-6 text-center">
            Your shelf is empty.
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
            subtitle={progressLabel(item)}
          />
        )}
      />
    </Screen>
  );
}
