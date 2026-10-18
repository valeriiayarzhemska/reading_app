import { useState } from 'react';
import { View } from 'react-native';

import type { CalendarDay } from '@reading/shared';

import { DaySheet } from '@/components/stats/DaySheet';
import { MonthCalendar } from '@/components/stats/MonthCalendar';

// Profile → "My reading": only the reader sees this. Totals and the yearly
// goal join the calendar in the next stories.
export function MyReading() {
  const [openDay, setOpenDay] = useState<CalendarDay | null>(null);

  return (
    <View className="gap-6">
      <MonthCalendar onPressDay={setOpenDay} />

      <DaySheet day={openDay} onClose={() => setOpenDay(null)} />
    </View>
  );
}
