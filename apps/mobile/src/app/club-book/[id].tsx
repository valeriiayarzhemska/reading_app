import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { FlashList } from '@shopify/flash-list';

import { BookRow } from '@/components/BookRow';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { useClub, useSetClubBook } from '@/api/clubs';
import { useShelf } from '@/api/shelf';
import { sortForPicking } from '@/library/sortForPicking';
import { useColors } from '@/theme/ThemeProvider';

// Host only: pick the club's "Reading together" book from your shelf
export default function ClubBookScreen() {
  const colors = useColors();

  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const club = useClub(id);
  const shelf = useShelf();
  const setBook = useSetClubBook(id);
  const currentId = club.data?.book?.id ?? null;

  function choose(bookId: string | null) {
    setBook.mutate(bookId, { onSuccess: () => router.back() });
  }

  if (!shelf.data || !club.data) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.fg} />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlashList
        data={sortForPicking(shelf.data)}
        keyExtractor={(entry) => entry.bookId}
        extraData={currentId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <View className="gap-3 pb-2 pt-2">
            <Text variant="muted">{t('clubs.book.hint')}</Text>

            {currentId ? (
              <Button
                title={t('clubs.book.stop')}
                variant="secondary"
                disabled={setBook.isPending}
                onPress={() => choose(null)}
              />
            ) : null}

            {setBook.error ? (
              <Text className="text-danger">{setBook.error.message}</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => choose(item.bookId)}
            disabled={setBook.isPending}
            className="active:opacity-60"
          >
            <BookRow
              title={item.book.title}
              authors={item.book.authors}
              coverUrl={item.book.coverUrl}
              action={
                item.bookId === currentId ? (
                  <Feather name="check" size={20} color={colors.accent} />
                ) : undefined
              }
            />
          </Pressable>
        )}
      />
    </Screen>
  );
}
