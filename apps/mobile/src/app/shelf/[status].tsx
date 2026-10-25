import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router, Stack, useLocalSearchParams } from 'expo-router';

import { FlashList } from '@shopify/flash-list';

import { ShelfStatus } from '@reading/shared';

import { BookRow } from '@/components/BookRow';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { useShelf } from '@/api/shelf';
import { progressLabel } from '@/library/progressLabel';

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

      <FlashList
        data={entries}
        keyExtractor={(entry) => entry.id}
        // NativeWind's contentContainerClassName only works on core lists
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 32,
        }}
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
