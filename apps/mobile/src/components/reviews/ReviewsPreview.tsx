import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import { ReviewCard } from '@/components/reviews/ReviewCard';
import { Text } from '@/components/ui/Text';

import { useBookReviews } from '@/api/reviews';

const PREVIEW_COUNT = 3;

// The newest few on a screen that is already a ScrollView; the full, paged
// list lives on the book page
export function ReviewsPreview({ bookId }: { bookId: string }) {
  const { t } = useTranslation();
  const { data } = useBookReviews(bookId);
  const reviews = data?.pages[0].items ?? [];

  if (reviews.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="heading">{t('reviews.readersReviews')}</Text>

        <Pressable
          onPress={() =>
            router.push({ pathname: '/books/[bookId]', params: { bookId } })
          }
          accessibilityRole="link"
          className="active:opacity-60"
        >
          <Text variant="label" className="text-accent">
            {t('reviews.all')}
          </Text>
        </Pressable>
      </View>

      {reviews.slice(0, PREVIEW_COUNT).map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </View>
  );
}
