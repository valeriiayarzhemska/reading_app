import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router, Stack } from 'expo-router';

import { FlashList } from '@shopify/flash-list';

import { COLLECTION_BOOKS_MAX } from '@reading/shared';

import { useCollectionDraft } from '@/components/collections/CollectionDraftProvider';
import { PickableCover } from '@/components/library/PickableCover';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { useShelf } from '@/api/shelf';
import { sortForPicking } from '@/library/sortForPicking';
import { COLORS } from '@/theme/colors';

// Changes go straight into the draft; Done just returns to the form
export default function CollectionBooksScreen() {
  const { t } = useTranslation();
  const draft = useCollectionDraft();
  const shelf = useShelf();
  const pickedIds = draft.books.map((book) => book.bookId);
  const isFull = pickedIds.length >= COLLECTION_BOOKS_MAX;

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.back()}
              className="active:opacity-60"
            >
              <Text className="font-sans-semibold text-accent">
                {t('collections.done')}
              </Text>
            </Pressable>
          ),
        }}
      />

      {shelf.data ? (
        <FlashList
          data={sortForPicking(shelf.data)}
          keyExtractor={(entry) => entry.bookId}
          numColumns={3}
          // Cells only re-render when data changes; the picks live outside it
          extraData={pickedIds}
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingTop: 8,
            paddingBottom: 32,
          }}
          ListHeaderComponent={
            <View className="mb-3 px-1.5">
              <Text variant="muted">{t('collections.pickHint')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PickableCover
              title={item.book.title}
              coverUrl={item.book.coverUrl}
              position={pickedIds.indexOf(item.bookId)}
              isFull={isFull}
              onToggle={() =>
                draft.toggleBook({
                  bookId: item.bookId,
                  title: item.book.title,
                  authors: item.book.authors,
                  coverUrl: item.book.coverUrl,
                })
              }
            />
          )}
        />
      ) : (
        <ActivityIndicator className="mt-8" color={COLORS.fg} />
      )}
    </Screen>
  );
}
