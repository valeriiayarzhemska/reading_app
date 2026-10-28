import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import {
  dayWithBook,
  minutesLeft,
  progressFraction,
  ProgressUnit,
  ShelfStatus,
  type UserBookWithBook,
} from '@reading/shared';

import { FinishedSheet } from '@/components/library/FinishedSheet';
import { ReviewSheet } from '@/components/library/ReviewSheet';
import { UpdateProgressSheet } from '@/components/library/UpdateProgressSheet';
import { BookQuotes } from '@/components/quotes/BookQuotes';
import { RatingSummary } from '@/components/reviews/RatingSummary';
import { ReviewsPreview } from '@/components/reviews/ReviewsPreview';
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
  useRemoveFinish,
  useRemoveFromShelf,
  useShelfEntry,
  useUpdateStatus,
} from '@/api/shelf';
import { currentLanguage } from '@/i18n';
import { formatDuration } from '@/lib/format';
import { formatFinishDate } from '@/library/finishDate';
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
  // ?rate=1: opened from the timer's "Mark as read", show the sheet at once
  const { rate } = useLocalSearchParams<{ rate?: string }>();
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isFinishedOpen, setIsFinishedOpen] = useState(rate === '1');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  // Where "Actually not finished yet" puts the book back
  const previousStatus = useRef<ShelfStatus>(ShelfStatus.READING);
  const updateStatus = useUpdateStatus(entry.id);
  const removeFinish = useRemoveFinish();
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

  function changeStatus(status: ShelfStatus) {
    if (status === ShelfStatus.READ && entry.status !== ShelfStatus.READ) {
      previousStatus.current = entry.status;
      setIsFinishedOpen(true);
    }

    updateStatus.mutate(status);
  }

  // A correction: back to the previous shelf and today's finish removed, in
  // one request (leaving Read on its own keeps the date, for rereads)
  function markNotFinished() {
    setIsFinishedOpen(false);
    removeFinish.mutate({ id: entry.id, status: previousStatus.current });
  }

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
            {entry.status === ShelfStatus.READ && entry.finishedAt ? (
              <Text variant="label">
                {t('book.finished.label', {
                  date: formatFinishDate(
                    entry.finishedAt,
                    entry.finishedPrecision,
                    currentLanguage(),
                  ),
                })}
              </Text>
            ) : null}

            <Text variant="heading" className="text-center text-2xl">
              {entry.book.title}
            </Text>

            <Text variant="muted" className="text-center">
              {entry.book.authors.join(', ')}
            </Text>
          </View>

          <Pressable
            onPress={() =>
              router.push({
                pathname: '/books/[bookId]',
                params: { bookId: entry.bookId },
              })
            }
            accessibilityRole="link"
            className="active:opacity-60"
          >
            <RatingSummary
              ratingAvg={entry.book.ratingAvg}
              ratingCount={entry.book.ratingCount}
            />
          </Pressable>
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
            onChange={changeStatus}
          />

          {updateStatus.isError ? (
            <Text className="text-center text-sm text-danger">
              {t('book.statusError')}
            </Text>
          ) : null}
        </View>

        {entry.status === ShelfStatus.READ ? (
          <Card className="gap-1 py-2">
            <Pressable
              onPress={() => setIsFinishedOpen(true)}
              accessibilityRole="button"
              className="flex-row items-center justify-between py-2 active:opacity-60"
            >
              <Text className="font-sans-semibold text-accent-light">
                {entry.rating === null
                  ? t('book.finished.rate')
                  : t('book.finished.yourRating', { rating: entry.rating })}
              </Text>

              <Feather name="chevron-right" size={18} color={COLORS.fgFaint} />
            </Pressable>

            <Pressable
              onPress={() => setIsReviewOpen(true)}
              accessibilityRole="button"
              className="flex-row items-center justify-between gap-3 border-t border-border py-2 active:opacity-60"
            >
              {entry.review ? (
                <View className="flex-1 gap-0.5">
                  <Text variant="label">{t('reviews.yours')}</Text>

                  <Text numberOfLines={2}>{entry.review.text}</Text>
                </View>
              ) : (
                <Text>{t('reviews.write')}</Text>
              )}

              <Feather name="chevron-right" size={18} color={COLORS.fgFaint} />
            </Pressable>

            {entry.finishedAt ? (
              <Pressable
                onPress={() => setIsFinishedOpen(true)}
                accessibilityRole="button"
                className="flex-row items-center justify-between border-t border-border py-2 active:opacity-60"
              >
                <Text>
                  {t('book.finished.row', {
                    date: formatFinishDate(
                      entry.finishedAt,
                      entry.finishedPrecision,
                      currentLanguage(),
                    ),
                  })}
                </Text>

                <Feather
                  name="chevron-right"
                  size={18}
                  color={COLORS.fgFaint}
                />
              </Pressable>
            ) : null}
          </Card>
        ) : null}

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

        <BookQuotes entry={entry} />

        <ReviewsPreview bookId={entry.bookId} />

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

      <FinishedSheet
        entry={entry}
        open={isFinishedOpen}
        onClose={() => setIsFinishedOpen(false)}
        onNotFinished={markNotFinished}
      />

      <ReviewSheet
        entry={entry}
        open={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
      />

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
