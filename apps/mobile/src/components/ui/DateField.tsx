import { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';

import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';

import { Text } from '@/components/ui/Text';

import { currentLanguage } from '@/i18n';
import { useColors, useTheme } from '@/theme/ThemeProvider';

interface DateFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

// A row "label ··· [6 Sep 2021]"; tapping the pill picks a date.
// Android: the system date dialog, which closes itself.
// iOS: an inline calendar in a Modal that closes as soon as a day is
// picked. (iOS's own "compact" pill keeps its popover open after a pick,
// and inside a bottom sheet the tap-outside that closes it doesn't arrive.)
export function DateField({
  label,
  value,
  onChange,
  maximumDate,
  minimumDate,
}: DateFieldProps) {
  const colors = useColors();
  const { scheme } = useTheme();

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        maximumDate,
        minimumDate,
        onValueChange: (_event, date) => onChange(date),
      });

      return;
    }

    setIsCalendarOpen(true);
  }

  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-2.5">
      <Text>{label}</Text>

      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="rounded-full bg-card-strong px-4 py-2 active:opacity-70"
      >
        <Text>
          {new Intl.DateTimeFormat(currentLanguage(), {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).format(value)}
        </Text>
      </Pressable>

      {Platform.OS === 'ios' ? (
        // A native modal sits above everything, the bottom sheet included
        <Modal
          visible={isCalendarOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCalendarOpen(false)}
        >
          <Pressable
            onPress={() => setIsCalendarOpen(false)}
            accessibilityLabel={label}
            className="flex-1 items-center justify-center px-4"
            style={{ backgroundColor: colors.backdrop }}
          >
            {/* Taps on the calendar itself must not reach the backdrop.
                No w-full: the native calendar has a fixed width and won't
                stretch, so the card wraps it and is centered instead. */}
            <Pressable
              onPress={() => {}}
              className="items-center gap-1 rounded-card px-2 pb-2 pt-4"
              style={{ backgroundColor: colors.sheet }}
            >
              <Text variant="label">{label}</Text>

              <DateTimePicker
                value={value}
                mode="date"
                display="inline"
                // Otherwise iOS uses the phone's language, not the app's
                locale={currentLanguage()}
                themeVariant={scheme}
                accentColor={colors.accent}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                onValueChange={(_event, date) => {
                  onChange(date);
                  setIsCalendarOpen(false);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
