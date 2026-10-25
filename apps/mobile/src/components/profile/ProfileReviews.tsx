import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import type { ProfileReview } from '@reading/shared';

import { BookCover } from '@/components/ui/BookCover';
import { Text } from '@/components/ui/Text';

import { COLORS } from '@/theme/colors';

interface ProfileReviewsProps {
  reviews: ProfileReview[];
  count: number;
}

export function ProfileReviews({ reviews, count }: ProfileReviewsProps) {
  const { t } = useTranslation();

  if (reviews.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      <Text variant="heading">{t('reviews.title', { count })}</Text>

      {reviews.map((review) => (
        <Pressable
          key={review.id}
          onPress={() =>
            router.push({
              pathname: '/books/[bookId]',
              params: { bookId: review.bookId },
            })
          }
          className="flex-row gap-3 active:opacity-70"
        >
          <BookCover uri={review.coverUrl} title={review.title} size="sm" />

          <View className="flex-1 gap-1">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 font-serif" numberOfLines={1}>
                {review.title}
              </Text>

              {review.rating !== null ? (
                <View className="flex-row items-center gap-0.5">
                  <MaterialCommunityIcons
                    name="fire"
                    size={13}
                    color={COLORS.accent}
                  />

                  <Text className="font-sans-semibold text-xs">
                    {review.rating}/10
                  </Text>
                </View>
              ) : null}
            </View>

            {review.text === null ? (
              <View className="flex-row items-center gap-1.5">
                <Feather name="eye-off" size={13} color={COLORS.fgFaint} />

                <Text variant="muted" className="flex-1 text-sm">
                  {t('reviews.spoilerOnProfile')}
                </Text>
              </View>
            ) : (
              <Text variant="muted" className="text-sm" numberOfLines={3}>
                {review.text}
              </Text>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}
