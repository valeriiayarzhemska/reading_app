import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { FAVORITES_MAX, type FavoriteBook } from '@reading/shared';

import { Text } from '@/components/ui/Text';

import { COLORS } from '@/theme/colors';

// Book covers are 7:10
const COVER_RATIO = 0.7;

interface FavoritesRowProps {
  favorites: FavoriteBook[];
  isMe: boolean;
}

// "Four favorites": always 4 slots in one row. Empty slots are shown only on
// your own profile, as an invitation to pick.
export function FavoritesRow({ favorites, isMe }: FavoritesRowProps) {
  const { t } = useTranslation();

  if (!isMe && favorites.length === 0) {
    return null;
  }

  const slots = Array.from(
    { length: FAVORITES_MAX },
    (_, index) => favorites[index] ?? null,
  );

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="heading">{t('profile.favorites.title')}</Text>

        {isMe ? (
          <Pressable
            onPress={() => router.push('/favorites')}
            accessibilityRole="button"
            className="active:opacity-60"
          >
            <Text variant="label" className="text-accent">
              {t('profile.favorites.change')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        {slots.map((book, index) =>
          book ? (
            <FavoriteCover key={book.userBookId} book={book} />
          ) : (
            <Pressable
              key={`empty-${index}`}
              onPress={isMe ? () => router.push('/favorites') : undefined}
              disabled={!isMe}
              accessibilityLabel={t('profile.favorites.change')}
              className="flex-1 items-center justify-center rounded-lg border border-dashed border-border active:opacity-60"
              style={{ aspectRatio: COVER_RATIO }}
            >
              <Feather name="plus" size={18} color={COLORS.fgFaint} />
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

function FavoriteCover({ book }: { book: FavoriteBook }) {
  if (!book.coverUrl) {
    return (
      <View
        className="flex-1 items-center justify-center rounded-lg border border-border bg-card-strong"
        style={{ aspectRatio: COVER_RATIO }}
      >
        <Text className="font-serif text-2xl text-fg-muted">
          {book.title.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={book.coverUrl}
      style={{ flex: 1, aspectRatio: COVER_RATIO, borderRadius: 8 }}
      contentFit="cover"
      accessibilityLabel={book.title}
    />
  );
}
