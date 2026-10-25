import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router, useLocalSearchParams } from 'expo-router';

import { FlashList } from '@shopify/flash-list';

import type { BookPage } from '@reading/shared';

import { RatingSummary } from '@/components/reviews/RatingSummary';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { BookCover } from '@/components/ui/BookCover';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { useAddBookToShelf, useBookPage, useBookReviews } from '@/api/reviews';
import { COLORS } from '@/theme/colors';

// The book itself, for anyone: readingapp://books/<bookId>. Your own shelf
// entry for it is book/[id].
export default function BookPageScreen() {
  const { t } = useTranslation();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const page = useBookPage(bookId);
  const reviews = useBookReviews(bookId);

  if (!page.data) {
    return (
      <Screen className="items-center justify-center px-6">
        {page.error ? (
          <Text className="text-center">{page.error.message}</Text>
        ) : (
          <ActivityIndicator color={COLORS.fg} />
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <FlashList
        data={reviews.data?.pages.flatMap((p) => p.items) ?? []}
        keyExtractor={(review) => review.id}
        renderItem={({ item }) => (
          <View className="pb-3">
            <ReviewCard review={item} />
          </View>
        )}
        onEndReached={() => {
          if (reviews.hasNextPage && !reviews.isFetchingNextPage) {
            reviews.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListHeaderComponent={<BookHeader book={page.data} />}
        ListEmptyComponent={
          reviews.isPending ? (
            <ActivityIndicator color={COLORS.fg} />
          ) : (
            <Text variant="muted" className="text-center">
              {t('reviews.empty')}
            </Text>
          )
        }
        ListFooterComponent={
          reviews.isFetchingNextPage ? (
            <ActivityIndicator className="py-4" color={COLORS.fg} />
          ) : null
        }
      />
    </Screen>
  );
}

function BookHeader({ book }: { book: BookPage }) {
  const { t } = useTranslation();
  const add = useAddBookToShelf(book.id);

  return (
    <View className="gap-6 pb-4 pt-2">
      <View className="items-center gap-3">
        <BookCover uri={book.coverUrl} title={book.title} size="lg" />

        <View className="items-center gap-1">
          <Text variant="heading" className="text-center text-2xl">
            {book.title}
          </Text>

          <Text variant="muted" className="text-center">
            {book.authors.join(', ')}
          </Text>
        </View>

        <RatingSummary
          ratingAvg={book.ratingAvg}
          ratingCount={book.ratingCount}
        />
      </View>

      {book.myEntryId ? (
        <Button
          title={t('reviews.openOnShelf')}
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: '/book/[id]',
              params: { id: book.myEntryId ?? '' },
            })
          }
        />
      ) : (
        <Button
          title={t('reviews.addToShelf')}
          loading={add.isPending}
          onPress={() => add.mutate()}
        />
      )}

      {add.error ? (
        <Text className="text-center text-sm text-danger">
          {add.error.message}
        </Text>
      ) : null}

      <Text variant="heading">
        {t('reviews.title', { count: book.reviewsCount })}
      </Text>
    </View>
  );
}
