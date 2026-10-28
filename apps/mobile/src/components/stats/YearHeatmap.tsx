import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';

import { heatLevel } from '@reading/shared';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

import { useCalendarYear } from '@/api/stats';
import { currentLanguage } from '@/i18n';
import { cn } from '@/lib/cn';
import { shortMonthNames } from '@/library/finishDate';
import { monthGrid } from '@/stats/month';
import { useColors } from '@/theme/ThemeProvider';

// Background per heat level: empty → full accent
const LEVEL_CLASSES = [
  'bg-white/5',
  'bg-accent/25',
  'bg-accent/45',
  'bg-accent/70',
  'bg-accent',
] as const;

interface YearHeatmapProps {
  initialYear: number;
  thisYear: number;
  // Tap on a month → the month view of it
  onOpenMonth: (month: string) => void;
  onBack: () => void;
}

export function YearHeatmap({
  initialYear,
  thisYear,
  onOpenMonth,
  onBack,
}: YearHeatmapProps) {
  const colors = useColors();

  const { t } = useTranslation();
  const [year, setYear] = useState(initialYear);
  const { data, isPending, error } = useCalendarYear(year);
  const monthNames = shortMonthNames(currentLanguage());

  return (
    <Card className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text variant="heading" className="text-2xl">
          {year}
        </Text>

        <View className="flex-row items-center gap-1">
          <YearArrow
            icon="chevron-left"
            label={t('stats.previousYear')}
            onPress={() => setYear((current) => current - 1)}
          />

          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            className="rounded-full border border-accent/50 bg-accent/15 px-3 py-1 active:opacity-70"
          >
            <Text className="font-sans-semibold text-xs text-accent-text">
              {t('stats.toMonth')}
            </Text>
          </Pressable>

          <YearArrow
            icon="chevron-right"
            label={t('stats.nextYear')}
            disabled={year >= thisYear}
            onPress={() => setYear((current) => current + 1)}
          />
        </View>
      </View>

      {data ? (
        <Text variant="muted">
          {t('stats.yearSummary', {
            year,
            books: t('stats.books', { count: data.summary.booksFinished }),
            hours: t('stats.hours', {
              count: Math.round(data.summary.minutes / 60),
            }),
          })}
        </Text>
      ) : null}

      {isPending ? (
        <ActivityIndicator className="py-16" color={colors.fg} />
      ) : error ? (
        <Text variant="muted" className="py-8 text-center">
          {error.message}
        </Text>
      ) : (
        <View className="flex-row flex-wrap gap-y-4">
          {monthNames.map((name, index) => {
            const month = `${year}-${String(index + 1).padStart(2, '0')}`;

            return (
              <Pressable
                key={month}
                onPress={() => onOpenMonth(month)}
                accessibilityRole="button"
                accessibilityLabel={name}
                // 3 months per row
                className="w-1/3 gap-1.5 px-1.5 active:opacity-70"
              >
                <Text variant="label">{name}</Text>

                <View className="gap-[2px]">
                  {monthGrid(month).map((week, weekIndex) => (
                    <View key={weekIndex} className="flex-row gap-[2px]">
                      {week.map((date, dayIndex) => (
                        <View
                          key={date ?? `blank-${dayIndex}`}
                          className={cn(
                            'aspect-square flex-1 rounded-[2px]',
                            date
                              ? LEVEL_CLASSES[
                                  heatLevel(data.minutesByDay[date] ?? 0)
                                ]
                              : 'bg-transparent',
                          )}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Card>
  );
}

interface YearArrowProps {
  icon: 'chevron-left' | 'chevron-right';
  label: string;
  disabled?: boolean;
  onPress: () => void;
}

function YearArrow({ icon, label, disabled = false, onPress }: YearArrowProps) {
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
