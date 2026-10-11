import { ShelfStatus, type UserBookWithBook } from '@reading/shared';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Button,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useShelf } from '@/api/shelf';
import { BookRow } from '@/components/book-row';

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

export default function ShelfScreen() {
  const { data, isPending, error, refetch, isRefetching } = useShelf();

  if (isPending) {
    return <ActivityIndicator style={styles.center} />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Could not load your shelf: {error.message}</Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <SectionList
      sections={toSections(data)}
      keyExtractor={(userBook) => userBook.id}
      contentContainerStyle={styles.list}
      onRefresh={refetch}
      refreshing={isRefetching}
      ListHeaderComponent={
        <Button title="+ Add a book" onPress={() => router.push('/search')} />
      }
      ListEmptyComponent={<Text>Your shelf is empty.</Text>}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>
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
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  list: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#888',
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 4,
  },
});
