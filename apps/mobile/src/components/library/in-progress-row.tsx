import { progressFraction, type UserBookWithBook } from '@reading/shared';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { BookCover } from '@/components/ui/book-cover';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Text } from '@/components/ui/text';

export function InProgressRow({ entries }: { entries: UserBookWithBook[] }) {
  const { t } = useTranslation();

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="label">{t('library.stillInProgress')}</Text>

        <Text variant="label">{entries.length}</Text>
      </View>

      {/* Negative margin + padding: the row scrolls edge to edge of the screen */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-4"
        contentContainerClassName="gap-4 px-4"
      >
        {entries.map((entry) => {
          const fraction = progressFraction(entry);

          return (
            <View key={entry.id} className="w-20 gap-2">
              <BookCover
                uri={entry.book.coverUrl}
                title={entry.book.title}
                size="md"
              />

              {fraction !== null ? (
                <View className="gap-1">
                  <ProgressBar value={fraction} />

                  <Text variant="muted" className="text-xs">
                    {Math.round(fraction * 100)}%
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
