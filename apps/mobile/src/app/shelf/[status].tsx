import { ShelfStatus } from '@reading/shared';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable } from 'react-native';
import { useShelf } from '@/api/shelf';
import { BookRow } from '@/components/book-row';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { progressLabel } from '@/library/progress-label';

function isShelfStatus(value: unknown): value is ShelfStatus {
  return Object.values(ShelfStatus).includes(value as ShelfStatus);
}

export default function ShelfListScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ status: string }>();
  // URL params are untrusted strings: a deep link could contain anything
  const status = isShelfStatus(params.status)
    ? params.status
    : ShelfStatus.READING;
  const { data } = useShelf();
  const entries = (data ?? []).filter((entry) => entry.status === status);

  return (
    <Screen>
      <Stack.Screen options={{ title: t(`library.sections.${status}`) }} />

      <FlatList
        data={entries}
        keyExtractor={(entry) => entry.id}
        contentContainerClassName="px-4 pb-8 pt-2"
        ListEmptyComponent={
          <Text variant="muted" className="mt-6 text-center">
            {t('library.shelfEmpty')}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/book/[id]', params: { id: item.id } })
            }
            className="active:opacity-60"
          >
            <BookRow
              title={item.book.title}
              authors={item.book.authors}
              coverUrl={item.book.coverUrl}
              subtitle={progressLabel(item, t)}
            />
          </Pressable>
        )}
      />
    </Screen>
  );
}
