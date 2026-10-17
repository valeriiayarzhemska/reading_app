import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import {
  dayWithBook,
  minutesLeft,
  pagesLeft,
  progressFraction,
  type UserBookWithBook,
} from '@reading/shared';

import { StartSessionButton } from '@/components/timer/StartSessionButton';
import { BookCover } from '@/components/ui/BookCover';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Text } from '@/components/ui/Text';

import { useReadingSpeed } from '@/api/sessions';
import { formatDuration } from '@/lib/format';

export function CurrentReadingCard({ entry }: { entry: UserBookWithBook }) {
  const { t } = useTranslation();
  const fraction = progressFraction(entry);
  const left = pagesLeft(entry);
  const { data: speed } = useReadingSpeed();
  const timeLeft = minutesLeft(entry, speed);

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/book/[id]', params: { id: entry.id } })
      }
      className="active:opacity-80"
    >
      <Card className="gap-4">
        <View className="flex-row items-center justify-between">
          <Text variant="label">{t('library.readingNow')}</Text>

          {entry.startedAt ? (
            <View className="rounded-full bg-accent/15 px-2.5 py-1">
              <Text variant="label" className="text-accent">
                {t('library.day', { day: dayWithBook(entry.startedAt) })}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="flex-row gap-4">
          <BookCover
            uri={entry.book.coverUrl}
            title={entry.book.title}
            size="md"
          />

          <View className="flex-1 justify-between gap-3">
            <View className="gap-1">
              <Text variant="heading" numberOfLines={3}>
                {entry.book.title}
              </Text>

              <Text variant="muted" numberOfLines={1}>
                {entry.book.authors.join(', ')}
              </Text>
            </View>

            {fraction !== null ? (
              <View className="flex-row items-center gap-3">
                <ProgressRing value={fraction} size={52}>
                  <Text className="font-serif text-base">
                    {Math.round(fraction * 100)}
                  </Text>
                </ProgressRing>

                <View className="flex-1">
                  {left !== null ? (
                    <Text variant="muted">
                      {t('library.pagesLeft', { count: left })}
                    </Text>
                  ) : null}

                  {/* Hidden until there are enough sessions to estimate */}
                  {timeLeft !== null ? (
                    <Text variant="muted" className="text-xs">
                      {t('common.approx', {
                        value: formatDuration(timeLeft, t),
                      })}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <StartSessionButton entry={entry} />
      </Card>
    </Pressable>
  );
}
