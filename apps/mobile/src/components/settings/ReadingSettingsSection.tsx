import type { ReactNode } from 'react';
import { Platform, Pressable, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';

import { Card } from '@/components/ui/Card';
import { Chips } from '@/components/ui/Chips';
import { Text } from '@/components/ui/Text';

import { currentLanguage } from '@/i18n';
import {
  CHECK_AFTER_OPTIONS,
  useReadingSettings,
} from '@/settings/readingSettings';
import { COLORS } from '@/theme/colors';

export function ReadingSettingsSection() {
  const { t } = useTranslation();
  const { settings, update } = useReadingSettings();

  return (
    <View className="gap-2">
      <Text variant="label">{t('readingSettings.title')}</Text>

      <Card className="gap-4">
        <SettingRow
          label={t('readingSettings.noTimer')}
          hint={t('readingSettings.noTimerHint')}
          value={settings.noTimer}
          onChange={(noTimer) => update({ noTimer })}
        />

        {/* Without a timer there's nothing to check */}
        {settings.noTimer ? null : (
          <SettingRow
            label={t('readingSettings.stillReading')}
            hint={t('readingSettings.stillReadingHint')}
            value={settings.stillReadingCheck}
            onChange={(stillReadingCheck) => update({ stillReadingCheck })}
          >
            <Chips
              options={CHECK_AFTER_OPTIONS.map((minutes) => ({
                value: minutes,
                label: t('readingSettings.minutes', { count: minutes }),
              }))}
              value={settings.checkAfterMin}
              onChange={(checkAfterMin) => update({ checkAfterMin })}
            />
          </SettingRow>
        )}

        <SettingRow
          label={t('readingSettings.dailyReminder')}
          hint={t('readingSettings.dailyReminderHint')}
          value={settings.dailyReminder}
          onChange={(dailyReminder) => update({ dailyReminder })}
        >
          <TimeField
            hour={settings.reminderHour}
            minute={settings.reminderMinute}
            onChange={(reminderHour, reminderMinute) =>
              update({ reminderHour, reminderMinute })
            }
          />
        </SettingRow>
      </Card>
    </View>
  );
}

interface SettingRowProps {
  label: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
  // Extra choices, shown while the switch is on
  children?: ReactNode;
}

function SettingRow({
  label,
  hint,
  value,
  onChange,
  children,
}: SettingRowProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1 gap-0.5">
          <Text className="font-sans-semibold">{label}</Text>

          <Text variant="muted" className="text-xs">
            {hint}
          </Text>
        </View>

        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ true: COLORS.accent, false: COLORS.cardStrong }}
          thumbColor={COLORS.fg}
        />
      </View>

      {value ? children : null}
    </View>
  );
}

// The reminder's time. iOS: its own compact time pill (fine outside a
// bottom sheet). Android: the system time dialog.
function TimeField({
  hour,
  minute,
  onChange,
}: {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}) {
  const value = new Date();

  value.setHours(hour, minute, 0, 0);

  function pick(date: Date | undefined) {
    if (date) {
      onChange(date.getHours(), date.getMinutes());
    }
  }

  if (Platform.OS === 'ios') {
    return (
      <View className="items-start">
        <DateTimePicker
          value={value}
          mode="time"
          display="compact"
          locale={currentLanguage()}
          themeVariant="dark"
          onChange={(_event, date) => pick(date)}
        />
      </View>
    );
  }

  return (
    <Pressable
      onPress={() =>
        DateTimePickerAndroid.open({
          value,
          mode: 'time',
          is24Hour: true,
          onChange: (event, date) => {
            if (event.type === 'set') {
              pick(date);
            }
          },
        })
      }
      className="self-start rounded-full border border-border bg-card px-4 py-2 active:opacity-70"
    >
      <Text className="font-sans-semibold">
        {new Intl.DateTimeFormat(currentLanguage(), {
          hour: '2-digit',
          minute: '2-digit',
        }).format(value)}
      </Text>
    </Pressable>
  );
}
