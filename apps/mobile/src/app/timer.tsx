import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { dayWithBook, progressFraction, ShelfStatus } from '@reading/shared';

import { FinishSessionSheet } from '@/components/timer/FinishSessionSheet';
import { BookCover } from '@/components/ui/BookCover';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import type { SaveOutcome } from '@/api/sessions';
import { useUpdateStatus } from '@/api/shelf';
import { useNow } from '@/hooks/useNow';
import { COLORS } from '@/theme/colors';
import { elapsedMs, formatElapsed } from '@/timer/activeSession';
import { useActiveSession } from '@/timer/useActiveSession';

// This screen is a native modal, drawn by iOS above the whole app, including
// the root BottomSheetModalProvider. Sheets opened here need a provider
// inside the modal, or they'd appear underneath it.
export default function TimerScreen() {
  return (
    <BottomSheetModalProvider>
      <TimerContent />
    </BottomSheetModalProvider>
  );
}

function TimerContent() {
  const { t } = useTranslation();
  // ?finish=1: opened by the ■ button of the Live Activity
  const { finish } = useLocalSearchParams<{ finish?: string }>();
  const { session, pause, resume, clear } = useActiveSession();
  const now = useNow(session !== undefined);
  const [isFinishOpen, setIsFinishOpen] = useState(finish === '1');
  const wasRunning = useRef(false);
  const isSaved = useRef(false);
  const updateStatus = useUpdateStatus(session?.userBookId ?? '');

  // Same as pressing ■ here: freeze the clock at the moment of the tap
  const isRunning = session !== undefined && session.pausedAt === null;
  const handledFinish = useRef(false);

  useEffect(() => {
    if (finish === '1' && isRunning && !handledFinish.current) {
      handledFinish.current = true;
      wasRunning.current = true;
      pause();
    }
  }, [finish, isRunning, pause]);

  // A stale link, or the session was just saved / discarded while the modal
  // closes. Not a <Redirect>: that would navigate away during the animation.
  if (!session) {
    return <Screen>{null}</Screen>;
  }

  const isPaused = session.pausedAt !== null;
  const fraction = progressFraction({
    progressUnit: session.unit,
    currentProgress: session.progressFrom,
    book: { pageCount: session.book.pageCount, audioDurationMin: null },
  });
  const day = dayWithBook(
    session.bookStartedAt ?? new Date(session.startedAt).toISOString(),
  );

  function close() {
    router.back();
    clear();
  }

  // Freeze the clock first: the moment of Stop is when reading ended, not
  // when the page number has been typed
  function stop() {
    wasRunning.current = !isPaused;
    pause();
    setIsFinishOpen(true);
  }

  function cancelFinish() {
    setIsFinishOpen(false);

    // The sheet also reports closing after a save; only a real cancel resumes
    if (wasRunning.current && !isSaved.current) {
      resume();
    }
  }

  function onSaved(outcome: SaveOutcome) {
    isSaved.current = true;
    setIsFinishOpen(false);

    // Offline: kept on the phone, sent later by useSessionSync
    if (outcome.status === 'queued') {
      Alert.alert(t('timer.queuedTitle'), t('timer.queuedMessage'), [
        { text: t('timer.ok'), onPress: close },
      ]);

      return;
    }

    const { userBook } = outcome.result;
    const isFinished =
      progressFraction(userBook) === 1 && userBook.status !== ShelfStatus.READ;

    if (!isFinished) {
      close();

      return;
    }

    Alert.alert(
      t('timer.finishedTitle'),
      t('timer.finishedMessage', { title: userBook.book.title }),
      [
        { text: t('timer.notYet'), style: 'cancel', onPress: close },
        {
          text: t('timer.markRead'),
          // Then the book screen with its "finished, rate it?" sheet
          onPress: () =>
            updateStatus.mutate(ShelfStatus.READ, {
              onSettled: () => {
                close();
                router.push({
                  pathname: '/book/[id]',
                  params: { id: userBook.id, rate: '1' },
                });
              },
            }),
        },
      ],
    );
  }

  function confirmDiscard() {
    Alert.alert(t('timer.discardTitle'), t('timer.discardMessage'), [
      { text: t('book.cancel'), style: 'cancel' },
      { text: t('timer.discard'), style: 'destructive', onPress: close },
    ]);
  }

  return (
    <Screen className="px-6">
      <View className="flex-row justify-between pt-2">
        {/* Minimize: the session keeps running, the mini-timer shows it */}
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('timer.minimize')}
          className="h-11 w-11 items-center justify-center active:opacity-60"
        >
          <Feather name="chevron-down" size={28} color={COLORS.fg} />
        </Pressable>

        <Pressable
          onPress={confirmDiscard}
          accessibilityRole="button"
          accessibilityLabel={t('timer.discard')}
          className="h-11 w-11 items-center justify-center active:opacity-60"
        >
          <Feather name="trash-2" size={20} color={COLORS.fgMuted} />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center gap-8">
        <View className="items-center gap-3">
          <BookCover
            uri={session.book.coverUrl}
            title={session.book.title}
            size="lg"
          />

          <View className="items-center gap-1">
            <Text variant="heading" className="text-center" numberOfLines={2}>
              {session.book.title}
            </Text>

            <Text variant="muted" numberOfLines={1}>
              {session.book.authors.join(', ')}
            </Text>
          </View>
        </View>

        <Text
          className="font-serif text-7xl text-fg"
          style={{ fontVariant: ['tabular-nums'] }}
          accessibilityRole="timer"
        >
          {formatElapsed(elapsedMs(session, now))}
        </Text>

        <View className="w-full gap-2">
          <ProgressBar value={fraction ?? 0} />

          <Text variant="muted" className="text-center">
            {t('timer.info', {
              progress: t(`book.progressValue.${session.unit}`, {
                current: session.progressFrom,
              }),
              day,
            })}
          </Text>
        </View>

        <View className="flex-row items-center gap-6">
          <Pressable
            onPress={isPaused ? resume : pause}
            accessibilityRole="button"
            accessibilityLabel={isPaused ? t('timer.resume') : t('timer.pause')}
            className="h-20 w-20 items-center justify-center rounded-full bg-accent active:opacity-80"
          >
            <Feather
              name={isPaused ? 'play' : 'pause'}
              size={32}
              color={COLORS.backgroundBottom}
            />
          </Pressable>

          <Pressable
            onPress={stop}
            accessibilityRole="button"
            accessibilityLabel={t('timer.stop')}
            className="h-14 w-14 items-center justify-center rounded-full border border-border bg-card active:opacity-70"
          >
            <Feather name="square" size={20} color={COLORS.fg} />
          </Pressable>
        </View>
      </View>

      <FinishSessionSheet
        session={session}
        open={isFinishOpen}
        onClose={cancelFinish}
        onSaved={onSaved}
        now={now}
      />
    </Screen>
  );
}
