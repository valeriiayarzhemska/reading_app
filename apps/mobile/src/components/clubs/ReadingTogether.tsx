import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ClubSummary } from '@reading/shared';

import { ClubAvatar } from '@/components/clubs/ClubAvatar';
import { BookCover } from '@/components/ui/BookCover';
import { Text } from '@/components/ui/Text';

const CARD_WIDTH = 128;

interface ReadingTogetherProps {
  clubs: ClubSummary[];
  onOpen: (club: ClubSummary) => void;
}

// Clubs with a current book: its cover, the club's avatar on top
export function ReadingTogether({ clubs, onOpen }: ReadingTogetherProps) {
  const { t } = useTranslation();

  if (clubs.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      <Text variant="title" className="text-2xl">
        {t('clubs.readingTogether')}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-4"
        contentContainerClassName="px-4"
      >
        {clubs.map((club) =>
          club.book ? (
            <Pressable
              key={club.id}
              onPress={() => onOpen(club)}
              className="gap-1.5 active:opacity-70"
              // Plain style: margin classes don't apply in a horizontal
              // ScrollView (same as Recently read)
              style={{ width: CARD_WIDTH, marginRight: 12 }}
            >
              <View>
                <BookCover
                  uri={club.book.coverUrl}
                  title={club.book.title}
                  size="lg"
                />

                <View className="absolute bottom-2 left-2">
                  <ClubAvatar name={club.name} color={club.color} size={30} />
                </View>
              </View>

              <Text className="text-sm" numberOfLines={2}>
                {club.name}
              </Text>
            </Pressable>
          ) : null,
        )}
      </ScrollView>
    </View>
  );
}
