import { createMMKV, useMMKVObject } from 'react-native-mmkv';

// Per phone, not per account: a reminder at 21:00 belongs to this device
export const settingsStorage = createMMKV({ id: 'settings' });

const KEY = 'reading';

export interface ReadingSettings {
  // Log pages by hand instead of running a timer
  noTimer: boolean;
  // "Still reading?" notification while a timer runs
  stillReadingCheck: boolean;
  checkAfterMin: number;
  dailyReminder: boolean;
  reminderHour: number;
  reminderMinute: number;
}

export const DEFAULT_SETTINGS: ReadingSettings = {
  noTimer: false,
  stillReadingCheck: true,
  checkAfterMin: 60,
  dailyReminder: false,
  reminderHour: 21,
  reminderMinute: 0,
};

export const CHECK_AFTER_OPTIONS = [30, 60, 90, 120];

// Saved settings over the defaults: a setting added later just has its default
function withDefaults(saved: Partial<ReadingSettings> | undefined) {
  return { ...DEFAULT_SETTINGS, ...saved };
}

// Outside React (scheduling notifications)
export function readSettings(): ReadingSettings {
  const raw = settingsStorage.getString(KEY);

  return withDefaults(
    raw ? (JSON.parse(raw) as Partial<ReadingSettings>) : undefined,
  );
}

// Every screen using it re-renders when a setting changes
export function useReadingSettings() {
  const [saved, setSaved] = useMMKVObject<Partial<ReadingSettings>>(
    KEY,
    settingsStorage,
  );
  const settings = withDefaults(saved);

  function update(changes: Partial<ReadingSettings>) {
    setSaved({ ...settings, ...changes });
  }

  return { settings, update };
}
