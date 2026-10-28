import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import type { CalendarDay } from '@reading/shared';

import { AchievementsCard } from '@/components/stats/AchievementsCard';
import { DaySheet } from '@/components/stats/DaySheet';
import { GoalCard } from '@/components/stats/GoalCard';
import { MonthCalendar } from '@/components/stats/MonthCalendar';
import { TotalsCard } from '@/components/stats/TotalsCard';
import { Text } from '@/components/ui/Text';

import { useStats } from '@/api/stats';
import { COLORS } from '@/theme/colors';

// Profile → "My reading": only the reader sees this
export function MyReading() {
  const [openDay, setOpenDay] = useState<CalendarDay | null>(null);
  const stats = useStats();

  return (
    <View className="gap-6">
      {stats.isPending ? (
        <ActivityIndicator className="py-8" color={COLORS.fg} />
      ) : stats.error ? (
        <Text variant="muted" className="text-center">
          {stats.error.message}
        </Text>
      ) : (
        <>
          <TotalsCard stats={stats.data} />

          <GoalCard stats={stats.data} />
        </>
      )}

      <MonthCalendar onPressDay={setOpenDay} />

      <AchievementsCard />

      <DaySheet day={openDay} onClose={() => setOpenDay(null)} />
    </View>
  );
}
