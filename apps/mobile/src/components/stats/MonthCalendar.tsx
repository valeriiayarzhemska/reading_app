import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';

import type { CalendarDay } from '@reading/shared';

import { CalendarDayCell } from '@/components/stats/CalendarDayCell';
import { YearHeatmap } from '@/components/stats/YearHeatmap';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

import { useCalendar } from '@/api/stats';
import { currentLanguage } from '@/i18n';
import { formatMonth, weekdayNames } from '@/lib/format';
import { currentMonth, monthGrid, shiftMonth, today } from '@/stats/month';
import { useColors } from '@/theme/ThemeProvider';

interface MonthCalendarProps {
  onPressDay?: (day: CalendarDay) => void;
}

export function MonthCalendar({ onPressDay }: MonthCalendarProps) {
  const colors = useColors();

  const { t } = useTranslation();
  const language = currentLanguage();
  // Read once on mount: the clock isn't read during render
  const [{ thisMonth, todayDate }] = useState(() => ({
    thisMonth: currentMonth(),
    todayDate: today(),
  }));
  const [month, setMonth] = useState(thisMonth);
  // The same card shows a month or the whole year as a heatmap
  const [view, setView] = useState<'month' | 'year'>('month');
  const { data, isPending, error } = useCalendar(month);

  const days = new Map(data?.days.map((day) => [day.date, day]));
  // "YYYY-MM" strings compare correctly as text
  const isLatestMonth = month >= thisMonth;
  const [year] = month.split('-');

  if (view === 'year') {
    return (
      <YearHeatmap
        initialYear={Number(year)}
        thisYear={Number(thisMonth.slice(0, 4))}
        onOpenMonth={(picked) => {
          setMonth(picked);
          setView('month');
        }}
        onBack={() => setView('month')}
      />
    );
  }

  return (
    <Card className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text variant="heading" className="text-2xl">
          {formatMonth(month, language)}
        </Text>

        <View className="flex-row items-center gap-1">
          <MonthArrow
            icon="chevron-left"
            label={t('stats.previousMonth')}
            onPress={() => setMonth((current) => shiftMonth(current, -1))}
          />

          <Pressable
            onPress={() => setView('year')}
            accessibilityRole="button"
            accessibilityLabel={t('stats.openYear', { year })}
            className="rounded-full border border-border px-3 py-1 active:opacity-70"
          >
            <Text variant="muted" className="text-xs">
              {year}
            </Text>
          </Pressable>

          {/* No future months: there's nothing to show there yet */}
          <MonthArrow
            icon="chevron-right"
            label={t('stats.nextMonth')}
            disabled={isLatestMonth}
            onPress={() => setMonth((current) => shiftMonth(current, 1))}
          />
        </View>
      </View>

      <View className="flex-row gap-1">
        {weekdayNames(language).map((name) => (
          <Text
            key={name}
            variant="label"
            className="flex-1 text-center normal-case"
          >
            {name}
          </Text>
        ))}
      </View>

      {isPending ? (
        <ActivityIndicator className="py-16" color={colors.fg} />
      ) : error ? (
        <Text variant="muted" className="py-8 text-center">
          {error.message}
        </Text>
      ) : (
        <View className="gap-1">
          {monthGrid(month).map((week) => (
            <View key={week.find(Boolean)} className="flex-row gap-1">
              {week.map((date, index) => (
                <CalendarDayCell
                  key={date ?? `blank-${index}`}
                  date={date}
                  day={date ? days.get(date) : undefined}
                  isToday={date === todayDate}
                  onPress={onPressDay}
                />
              ))}
            </View>
          ))}
        </View>
      )}

      {data ? (
        <Text variant="muted" className="text-center">
          {t('stats.monthSummary', {
            books: t('stats.booksFinished', {
              count: data.summary.booksFinished,
            }),
            pages: t('stats.pages', { count: data.summary.pages }),
          })}
        </Text>
      ) : null}
    </Card>
  );
}

interface MonthArrowProps {
  icon: 'chevron-left' | 'chevron-right';
  label: string;
  disabled?: boolean;
  onPress: () => void;
}

function MonthArrow({
  icon,
  label,
  disabled = false,
  onPress,
}: MonthArrowProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-9 w-9 items-center justify-center rounded-full active:opacity-60 disabled:opacity-30"
    >
      <Feather name={icon} size={20} color={colors.fg} />
    </Pressable>
  );
}
