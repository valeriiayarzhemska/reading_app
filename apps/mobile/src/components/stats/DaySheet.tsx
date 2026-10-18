import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';

import type { CalendarDay, DaySession } from '@reading/shared';

import { EditSessionForm } from '@/components/stats/EditSessionForm';
import { BookCover } from '@/components/ui/BookCover';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';

import { useDaySessions } from '@/api/stats';
import { currentLanguage } from '@/i18n';
import { formatDate, formatDuration } from '@/lib/format';
import { COLORS } from '@/theme/colors';

interface DaySheetProps {
  // The tapped day; null = closed
  day: CalendarDay | null;
  onClose: () => void;
}

export function DaySheet({ day: openDay, onClose }: DaySheetProps) {
  const { t } = useTranslation();
  const isOpen = openDay !== null;
  // Keeps the last day while the sheet slides down; otherwise it would go
  // blank for the length of the closing animation
  const [lastDay, setLastDay] = useState(openDay);
  const [wasOpen, setWasOpen] = useState(isOpen);
  // One sheet, two views: the day's list, or the form for one session
  const [editing, setEditing] = useState<DaySession | null>(null);

  if (openDay && openDay !== lastDay) {
    setLastDay(openDay);
  }

  // Every opening starts on the list, not on a form left open last time
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);

    if (isOpen) {
      setEditing(null);
    }
  }

  const day = openDay ?? lastDay;
  const dateLabel = day ? formatDate(day.date, currentLanguage()) : '';
  const sessions = useDaySessions(day?.date ?? null);

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      title={editing ? t('stats.edit.title') : dateLabel}
    >
      {editing ? (
        <EditSessionForm
          key={editing.id}
          session={editing}
          dateLabel={dateLabel}
          onDone={() => setEditing(null)}
        />
      ) : (
        <>
          {day && day.finished.length > 0 ? (
            <View className="gap-2">
              <Text variant="label">{t('stats.day.finished')}</Text>

              {day.finished.map((book) => (
                <View
                  key={book.userBookId}
                  className="flex-row items-center gap-3"
                >
                  <BookCover uri={book.coverUrl} title={book.title} size="xs" />

                  <Text className="flex-1 font-serif" numberOfLines={2}>
                    {book.title}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View className="gap-2">
            <Text variant="label">{t('stats.day.sessions')}</Text>

            {sessions.isPending ? (
              <ActivityIndicator className="py-4" color={COLORS.fg} />
            ) : sessions.error ? (
              <Text variant="muted">{sessions.error.message}</Text>
            ) : sessions.data.length === 0 ? (
              <Text variant="muted">{t('stats.day.noSessions')}</Text>
            ) : (
              sessions.data.map((session) => (
                <Pressable
                  key={session.id}
                  onPress={() => setEditing(session)}
                  accessibilityRole="button"
                  className="flex-row items-center gap-3 border-b border-border py-2 active:opacity-60"
                >
                  <Text className="flex-1" numberOfLines={1}>
                    {session.book.title}
                  </Text>

                  <Text variant="muted" className="text-sm">
                    {formatDuration(Math.round(session.durationSec / 60), t)}
                  </Text>

                  {session.pages !== null ? (
                    <Text variant="muted" className="w-20 text-right text-sm">
                      {t('stats.pages', { count: session.pages })}
                    </Text>
                  ) : null}

                  <Feather
                    name="chevron-right"
                    size={16}
                    color={COLORS.fgFaint}
                  />
                </Pressable>
              ))
            )}
          </View>
        </>
      )}
    </Sheet>
  );
}
