import {
  dayWithBook,
  pagesLeft,
  progressFraction,
  type UserBookWithBook,
} from '@reading/shared';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StartSessionButton } from '@/components/timer/start-session-button';
import { BookCover } from '@/components/ui/book-cover';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Text } from '@/components/ui/text';

export function CurrentReadingCard({ entry }: { entry: UserBookWithBook }) {
  const { t } = useTranslation();
  const fraction = progressFraction(entry);
  const left = pagesLeft(entry);

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

                {left !== null ? (
                  <Text variant="muted" className="flex-1">
                    {t('library.pagesLeft', { count: left })}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        <StartSessionButton entry={entry} />
      </Card>
    </Pressable>
  );
}
