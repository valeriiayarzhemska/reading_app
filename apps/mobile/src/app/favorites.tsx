import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import { FlashList } from '@shopify/flash-list';

import { FAVORITES_MAX, type UserBookWithBook } from '@reading/shared';

import { PickableCover } from '@/components/library/PickableCover';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { useShelf } from '@/api/shelf';
import { usePublicProfile, useSetFavorites } from '@/api/users';
import { useAuth } from '@/auth/AuthContext';
import { sortForPicking } from '@/library/sortForPicking';
import { useColors } from '@/theme/ThemeProvider';

export default function FavoritesScreen() {
  const colors = useColors();

  const { state } = useAuth();
  const nickname = state.status === 'signedIn' ? state.user.nickname : '';
  const shelf = useShelf();
  const profile = usePublicProfile(nickname);

  if (!shelf.data || !profile.data) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.fg} />
      </Screen>
    );
  }

  // Mounted once both are loaded, so its state starts from the saved list
  return (
    <FavoritesPicker
      books={sortForPicking(shelf.data)}
      initial={profile.data.favorites.map((book) => book.userBookId)}
    />
  );
}

function FavoritesPicker({
  books,
  initial,
}: {
  books: UserBookWithBook[];
  initial: string[];
}) {
  const { t } = useTranslation();
  const save = useSetFavorites();
  // The order of this array is the order on the profile
  const [picked, setPicked] = useState(initial);
  const isFull = picked.length === FAVORITES_MAX;

  function toggle(userBookId: string) {
    setPicked((current) => {
      if (current.includes(userBookId)) {
        return current.filter((id) => id !== userBookId);
      }

      return current.length < FAVORITES_MAX
        ? [...current, userBookId]
        : current;
    });
  }

  return (
    <Screen>
      <FlashList
        data={books}
        keyExtractor={(entry) => entry.id}
        numColumns={3}
        // Cells only re-render when data changes; picked lives outside it
        extraData={picked}
        // 16 minus the cell's 6 of padding: the covers line up with the header
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingTop: 8,
          paddingBottom: 128,
        }}
        ListHeaderComponent={
          <View className="mb-3 gap-1 px-1.5">
            <Text variant="label">
              {t('profile.favorites.picked', {
                count: picked.length,
                max: FAVORITES_MAX,
              })}
            </Text>

            <Text variant="muted">{t('profile.favorites.hint')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PickableCover
            title={item.book.title}
            coverUrl={item.book.coverUrl}
            position={picked.indexOf(item.id)}
            isFull={isFull}
            onToggle={() => toggle(item.id)}
          />
        )}
      />

      <View className="absolute bottom-0 left-0 right-0 gap-2 px-4 pb-10 pt-3">
        {save.error ? (
          <Text className="text-center text-sm text-danger">
            {save.error.message}
          </Text>
        ) : null}

        <Button
          title={t('profile.favorites.save')}
          loading={save.isPending}
          onPress={() =>
            save.mutate(picked, { onSuccess: () => router.back() })
          }
        />
      </View>
    </Screen>
  );
}
