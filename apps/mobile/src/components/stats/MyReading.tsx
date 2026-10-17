import { View } from 'react-native';

import { MonthCalendar } from '@/components/stats/MonthCalendar';

// Profile → "My reading": only the reader sees this. Totals and the yearly
// goal join the calendar in the next stories.
export function MyReading() {
  return (
    <View className="gap-6">
      <MonthCalendar />
    </View>
  );
}
