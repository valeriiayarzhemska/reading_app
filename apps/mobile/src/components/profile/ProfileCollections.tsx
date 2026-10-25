import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import type { CollectionSummary } from '@reading/shared';

import { CollectionCollage } from '@/components/collections/CollectionCollage';
import { NEW_COLLECTION } from '@/components/collections/CollectionDraftProvider';
import { Text } from '@/components/ui/Text';

const CARD_WIDTH = 120;

interface ProfileCollectionsProps {
  collections: CollectionSummary[];
  isMe: boolean;
}

// Hidden on someone else's profile when empty; on yours it invites to create
export function ProfileCollections({
  collections,
  isMe,
}: ProfileCollectionsProps) {
  const { t } = useTranslation();

  if (!isMe && collections.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="heading">{t('collections.title')}</Text>

        {isMe ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/collection-editor/[id]',
                params: { id: NEW_COLLECTION },
              })
            }
            accessibilityRole="button"
            className="active:opacity-60"
          >
            <Text variant="label" className="text-accent">
              {t('collections.new')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {collections.length === 0 ? (
        <Text variant="muted">{t('collections.emptyMine')}</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4"
          contentContainerClassName="px-4"
        >
          {collections.map((collection) => (
            <Pressable
              key={collection.id}
              onPress={() =>
                router.push({
                  pathname: '/collections/[id]',
                  params: { id: collection.id },
                })
              }
              className="gap-1.5 active:opacity-70"
              // A plain style, as on Recently read: NativeWind's margin class
              // didn't apply to items of a horizontal ScrollView
              style={{ width: CARD_WIDTH, marginRight: 12 }}
            >
              <CollectionCollage
                covers={collection.covers}
                width={CARD_WIDTH}
              />

              <Text className="font-sans-semibold" numberOfLines={2}>
                {collection.title}
              </Text>

              <Text variant="muted" className="text-xs">
                {t('collections.bookCount', { count: collection.bookCount })}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
