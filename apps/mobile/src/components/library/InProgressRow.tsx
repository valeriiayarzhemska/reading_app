import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  BookFormat,
  progressFraction,
  type UserBookWithBook,
} from '@reading/shared';

import { BookCover } from '@/components/ui/BookCover';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';

import { useColors } from '@/theme/ThemeProvider';

export function InProgressRow({ entries }: { entries: UserBookWithBook[] }) {
  const colors = useColors();

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
            <Pressable
              key={entry.id}
              onPress={() =>
                router.push({
                  pathname: '/book/[id]',
                  params: { id: entry.id },
                })
              }
              className="w-20 gap-2 active:opacity-60"
            >
              <BookCover
                uri={entry.book.coverUrl}
                title={entry.book.title}
                size="md"
              />

              <Text className="font-sans text-xs" numberOfLines={2}>
                {entry.book.title}
              </Text>

              {fraction !== null ? (
                <View className="gap-1">
                  <ProgressBar value={fraction} />

                  <View className="flex-row items-center gap-1">
                    {entry.format === BookFormat.AUDIO ? (
                      <Feather
                        name="headphones"
                        size={11}
                        color={colors.fgMuted}
                      />
                    ) : null}

                    <Text variant="muted" className="text-xs">
                      {Math.round(fraction * 100)}%
                    </Text>
                  </View>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
