import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { BookCover } from '@/components/ui/BookCover';
import { Text } from '@/components/ui/Text';

import { useNow } from '@/hooks/useNow';
import { useColors } from '@/theme/ThemeProvider';
import { elapsedMs, formatElapsed } from '@/timer/activeSession';
import { useActiveSession } from '@/timer/useActiveSession';

export const MINI_TIMER_HEIGHT = 60;

export function MiniTimer() {
  const colors = useColors();

  const { t } = useTranslation();
  const { session, pause, resume } = useActiveSession();
  const now = useNow(session !== undefined);

  if (!session) {
    return null;
  }

  const isPaused = session.pausedAt !== null;

  return (
    <Pressable
      onPress={() => router.push('/timer')}
      accessibilityRole="button"
      accessibilityLabel={t('timer.open')}
      style={{ height: MINI_TIMER_HEIGHT }}
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-tab-bar px-3 active:opacity-80"
    >
      <BookCover
        uri={session.book.coverUrl}
        title={session.book.title}
        size="xs"
      />

      <View className="flex-1">
        <Text className="font-sans-semibold text-sm" numberOfLines={1}>
          {session.book.title}
        </Text>

        <Text
          variant="muted"
          className="text-xs"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatElapsed(elapsedMs(session, now))}
        </Text>
      </View>

      <Pressable
        onPress={isPaused ? resume : pause}
        accessibilityRole="button"
        accessibilityLabel={isPaused ? t('timer.resume') : t('timer.pause')}
        hitSlop={8}
        className="h-10 w-10 items-center justify-center rounded-full bg-accent/20 active:opacity-60"
      >
        <Feather
          name={isPaused ? 'play' : 'pause'}
          size={18}
          color={colors.accent}
        />
      </Pressable>
    </Pressable>
  );
}
