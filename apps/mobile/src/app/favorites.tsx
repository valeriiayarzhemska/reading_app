import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import { FlashList } from '@shopify/flash-list';

import {
  FAVORITES_MAX,
  ShelfStatus,
  type UserBookWithBook,
} from '@reading/shared';

import { Button } from '@/components/ui/Button';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { useShelf } from '@/api/shelf';
import { usePublicProfile, useSetFavorites } from '@/api/users';
import { useAuth } from '@/auth/AuthContext';
import { cn } from '@/lib/cn';
import { COLORS } from '@/theme/colors';

const COVER_RATIO = 0.7;
const STATUS_ORDER: ShelfStatus[] = [
  ShelfStatus.READ,
  ShelfStatus.READING,
  ShelfStatus.WANT_TO_READ,
  ShelfStatus.ABANDONED,
];

// Favorites are usually books you've finished: Read first, then the rest
function sortForPicking(books: UserBookWithBook[]): UserBookWithBook[] {
  return [...books].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  );
}

export default function FavoritesScreen() {
  const { state } = useAuth();
  const nickname = state.status === 'signedIn' ? state.user.nickname : '';
  const shelf = useShelf();
  const profile = usePublicProfile(nickname);

  if (!shelf.data || !profile.data) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={COLORS.fg} />
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
            entry={item}
            position={picked.indexOf(item.id)}
            isFull={isFull}
            onToggle={toggle}
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

interface PickableCoverProps {
  entry: UserBookWithBook;
  // Index in the picked list, -1 when not picked
  position: number;
  isFull: boolean;
  onToggle: (userBookId: string) => void;
}

function PickableCover({
  entry,
  position,
  isFull,
  onToggle,
}: PickableCoverProps) {
  const isPicked = position !== -1;

  return (
    <Pressable
      onPress={() => onToggle(entry.id)}
      disabled={isFull && !isPicked}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isPicked }}
      accessibilityLabel={entry.book.title}
      style={{ padding: 6 }}
      className={cn('active:opacity-70', isFull && !isPicked && 'opacity-40')}
    >
      <View style={{ aspectRatio: COVER_RATIO }}>
        {entry.book.coverUrl ? (
          <RemoteImage
            uri={entry.book.coverUrl}
            style={{ flex: 1, borderRadius: 8 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center rounded-lg border border-border bg-card-strong">
            <Text className="font-serif text-3xl text-fg-muted">
              {entry.book.title.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {isPicked ? (
          <View
            className="absolute inset-0 rounded-lg border-2 border-accent"
            pointerEvents="none"
          />
        ) : null}

        {isPicked ? (
          <View className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-accent">
            <Text className="font-sans-bold text-sm text-accent-fg">
              {position + 1}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
