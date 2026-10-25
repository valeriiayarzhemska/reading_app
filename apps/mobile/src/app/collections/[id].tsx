import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { FlashList } from '@shopify/flash-list';

import type { CollectionDetail } from '@reading/shared';

import { BookRow } from '@/components/BookRow';
import { CollectionCollage } from '@/components/collections/CollectionCollage';
import { Avatar } from '@/components/ui/Avatar';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { useCollection, useToggleLike } from '@/api/collections';
import { COLORS } from '@/theme/colors';

// readingapp://collections/<id>
export default function CollectionScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error } = useCollection(id);

  if (!data) {
    return (
      <Screen className="items-center justify-center px-6">
        {error ? (
          <Text className="text-center">{error.message}</Text>
        ) : (
          <ActivityIndicator color={COLORS.fg} />
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerRight: data.isMine
            ? () => (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/collection-editor/[id]',
                      params: { id: data.id },
                    })
                  }
                  className="active:opacity-60"
                >
                  <Text className="font-sans-semibold text-accent">
                    {t('collections.edit')}
                  </Text>
                </Pressable>
              )
            : undefined,
        }}
      />

      <FlashList
        data={data.books}
        keyExtractor={(book) => book.bookId}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/books/[bookId]',
                params: { bookId: item.bookId },
              })
            }
            className="active:opacity-60"
          >
            <BookRow
              title={item.title}
              authors={item.authors}
              coverUrl={item.coverUrl}
            />
          </Pressable>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListHeaderComponent={<CollectionHeader collection={data} />}
        ListEmptyComponent={
          <Text variant="muted" className="text-center">
            {t('collections.emptyBooks')}
          </Text>
        }
      />
    </Screen>
  );
}

function CollectionHeader({ collection }: { collection: CollectionDetail }) {
  const { t } = useTranslation();
  const toggleLike = useToggleLike(collection.id);

  return (
    <View className="gap-4 pb-4 pt-2">
      <View className="items-center">
        <CollectionCollage
          covers={collection.books.map((book) => book.coverUrl)}
          width={180}
        />
      </View>

      <View className="gap-1.5">
        <Text variant="title">{collection.title}</Text>

        {collection.description ? (
          <Text variant="muted">{collection.description}</Text>
        ) : null}
      </View>

      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/user/[nickname]',
              params: { nickname: collection.author.nickname },
            })
          }
          className="flex-1 flex-row items-center gap-2 active:opacity-60"
        >
          <Avatar
            name={collection.author.displayName}
            url={collection.author.avatarUrl}
            size={28}
          />

          <Text className="flex-1 text-sm" numberOfLines={1}>
            {collection.author.displayName}
            <Text variant="muted" className="text-sm">
              {' · '}
              {t('collections.bookCount', { count: collection.books.length })}
            </Text>
          </Text>
        </Pressable>

        <Pressable
          onPress={() => toggleLike.mutate(!collection.isLiked)}
          accessibilityRole="button"
          accessibilityState={{ selected: collection.isLiked }}
          accessibilityLabel={t('collections.like')}
          className="flex-row items-center gap-1.5 rounded-full bg-card px-3 py-2 active:opacity-70"
        >
          <Ionicons
            name={collection.isLiked ? 'heart' : 'heart-outline'}
            size={17}
            color={collection.isLiked ? COLORS.accent : COLORS.fgFaint}
          />

          <Text
            className={
              collection.isLiked
                ? 'font-sans-semibold text-accent'
                : 'font-sans-semibold'
            }
          >
            {collection.likesCount}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
