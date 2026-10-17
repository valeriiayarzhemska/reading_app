import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { router, useLocalSearchParams } from 'expo-router';

import {
  dayWithBook,
  minutesLeft,
  progressFraction,
  ProgressUnit,
  ShelfStatus,
  type UserBookWithBook,
} from '@reading/shared';

import { UpdateProgressSheet } from '@/components/library/UpdateProgressSheet';
import { LogReadingSheet } from '@/components/timer/LogReadingSheet';
import { StartSessionButton } from '@/components/timer/StartSessionButton';
import { BookCover } from '@/components/ui/BookCover';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';

import { useReadingSpeed } from '@/api/sessions';
import {
  useRemoveFromShelf,
  useShelfEntry,
  useUpdateStatus,
} from '@/api/shelf';
import { formatDuration } from '@/lib/format';
import { COLORS } from '@/theme/colors';

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, error } = useShelfEntry(id);

  if (!entry) {
    return (
      <Screen className="items-center justify-center px-6">
        {error ? (
          <Text className="text-center">{error.message}</Text>
        ) : (
          <ActivityIndicator color={COLORS.fg} />
        )}
      </Screen>
    );
  }

  return <BookDetails entry={entry} />;
}

function BookDetails({ entry }: { entry: UserBookWithBook }) {
  const { t } = useTranslation();
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const updateStatus = useUpdateStatus(entry.id);
  const remove = useRemoveFromShelf(entry.id);
  const fraction = progressFraction(entry);
  const { data: speed } = useReadingSpeed();
  const timeLeft = minutesLeft(entry, speed);

  const statusOptions: SegmentOption<ShelfStatus>[] = [
    {
      value: ShelfStatus.WANT_TO_READ,
      label: t('library.sections.WANT_TO_READ'),
    },
    { value: ShelfStatus.READING, label: t('library.sections.READING') },
    { value: ShelfStatus.READ, label: t('library.sections.READ') },
  ];

  function confirmRemove() {
    Alert.alert(t('book.removeTitle'), t('book.removeMessage'), [
      { text: t('book.cancel'), style: 'cancel' },
      {
        text: t('book.remove'),
        style: 'destructive',
        onPress: () =>
          remove.mutate(undefined, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-6 px-4 pb-12 pt-2">
        <View className="items-center gap-3">
          <BookCover
            uri={entry.book.coverUrl}
            title={entry.book.title}
            size="lg"
          />

          <View className="items-center gap-1">
            <Text variant="heading" className="text-center text-2xl">
              {entry.book.title}
            </Text>

            <Text variant="muted" className="text-center">
              {entry.book.authors.join(', ')}
            </Text>
          </View>
        </View>

        <View className="gap-1">
          <StartSessionButton entry={entry} />

          <Pressable
            onPress={() => setIsLogOpen(true)}
            accessibilityRole="button"
            className="items-center py-2 active:opacity-60"
          >
            <Text variant="muted" className="text-sm">
              {t('timer.log.link')}
            </Text>
          </Pressable>
        </View>

        <Card className="flex-row justify-around">
          <Stat
            value={entry.book.pageCount ? String(entry.book.pageCount) : '—'}
            label={t('book.pages')}
          />

          <Stat
            value={fraction !== null ? `${Math.round(fraction * 100)}%` : '—'}
            label={t('book.progress')}
          />

          {timeLeft !== null ? (
            <Stat
              value={t('common.approx', {
                value: formatDuration(timeLeft, t),
              })}
              label={t('book.timeLeftLabel')}
              compact
            />
          ) : null}

          <Stat
            value={entry.startedAt ? String(dayWithBook(entry.startedAt)) : '—'}
            label={t('book.dayLabel')}
          />
        </Card>

        <View className="gap-2">
          <SegmentedControl
            options={statusOptions}
            value={entry.status}
            onChange={(status) => updateStatus.mutate(status)}
          />

          {updateStatus.isError ? (
            <Text className="text-center text-sm text-danger">
              {t('book.statusError')}
            </Text>
          ) : null}
        </View>

        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="label">{t('book.progress')}</Text>

            <Pressable
              onPress={() => setIsProgressOpen(true)}
              accessibilityRole="button"
              className="active:opacity-60"
            >
              <Text className="font-sans-semibold text-accent">
                {t('book.update')}
              </Text>
            </Pressable>
          </View>

          <ProgressBar value={fraction ?? 0} />

          <Text variant="muted">
            {entry.progressUnit === ProgressUnit.PAGES && entry.book.pageCount
              ? t('library.progressPage', {
                  current: entry.currentProgress,
                  total: entry.book.pageCount,
                })
              : t(`book.progressValue.${entry.progressUnit}`, {
                  current: entry.currentProgress,
                })}
          </Text>
        </Card>

        <Pressable
          onPress={confirmRemove}
          disabled={remove.isPending}
          className="items-center py-2 active:opacity-60"
        >
          <Text className="text-danger">{t('book.remove')}</Text>
        </Pressable>

        {remove.error ? (
          <Text className="text-center text-sm text-danger">
            {remove.error.message}
          </Text>
        ) : null}
      </ScrollView>

      <LogReadingSheet
        entry={entry}
        open={isLogOpen}
        onClose={() => setIsLogOpen(false)}
      />

      <UpdateProgressSheet
        entry={entry}
        open={isProgressOpen}
        onClose={() => setIsProgressOpen(false)}
      />
    </Screen>
  );
}

function Stat({
  value,
  label,
  compact = false,
}: {
  value: string;
  label: string;
  // Long values ("≈ 9 h 48 min") use a smaller size, as in the design
  compact?: boolean;
}) {
  return (
    <View className="items-center justify-end gap-0.5">
      <Text
        className={compact ? 'font-serif text-base' : 'font-serif text-2xl'}
      >
        {value}
      </Text>

      <Text variant="muted" className="text-xs">
        {label}
      </Text>
    </View>
  );
}
