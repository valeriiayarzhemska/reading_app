import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import type { BookReview } from '@reading/shared';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

import { currentLanguage } from '@/i18n';
import { useColors } from '@/theme/ThemeProvider';

function reviewDate(iso: string): string {
  return new Intl.DateTimeFormat(currentLanguage(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function ReviewCard({ review }: { review: BookReview }) {
  const colors = useColors();

  const { t } = useTranslation();
  // Your own spoilers are no surprise to you
  const [isRevealed, setIsRevealed] = useState(review.isMine);
  const isHidden = review.hasSpoilers && !isRevealed;

  return (
    <Card className="gap-3">
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/user/[nickname]',
            params: { nickname: review.author.nickname },
          })
        }
        className="flex-row items-center gap-3 active:opacity-60"
      >
        <Avatar
          name={review.author.displayName}
          url={review.author.avatarUrl}
          size={36}
        />

        <View className="flex-1">
          <Text className="font-sans-semibold" numberOfLines={1}>
            {review.author.displayName}
          </Text>

          <Text variant="muted" className="text-xs">
            {reviewDate(review.createdAt)}
          </Text>
        </View>

        {review.rating !== null ? (
          <View className="flex-row items-center gap-0.5">
            <MaterialCommunityIcons
              name="fire"
              size={15}
              color={colors.accent}
            />

            <Text className="font-sans-semibold text-sm">
              {review.rating}/10
            </Text>
          </View>
        ) : null}
      </Pressable>

      {isHidden ? (
        <Pressable
          onPress={() => setIsRevealed(true)}
          accessibilityRole="button"
          className="flex-row items-center gap-2 rounded-xl bg-card-strong px-3 py-3 active:opacity-70"
        >
          <Feather name="eye-off" size={16} color={colors.fgFaint} />

          <Text variant="muted" className="flex-1">
            {t('reviews.spoilerHidden')}
          </Text>

          <Text className="font-sans-semibold text-accent">
            {t('reviews.show')}
          </Text>
        </Pressable>
      ) : (
        <Text>{review.text}</Text>
      )}
    </Card>
  );
}
