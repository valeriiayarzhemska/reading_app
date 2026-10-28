import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

import { i18n } from '@/i18n';

// Scheduled on the phone itself: no server, no push service, no Apple account
const CHANNEL_ID = 'reminders';

// Fixed ids: scheduling again with the same id replaces the old one, so
// there's never more than one of each waiting
const STILL_READING_ID = 'still-reading';
const DAILY_ID = 'daily-reminder';

let isSetUp = false;

export function setUpNotifications() {
  if (isSetUp) {
    return;
  }

  isSetUp = true;

  // Shown as a banner even when the app is open
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  // Android groups notifications by channel; users can mute each one
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: i18n.t('reminders.channel'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

// Asks only once; after "Don't allow" the system won't show the prompt again
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  if (!current.canAskAgain) {
    return false;
  }

  const answer = await Notifications.requestPermissionsAsync();

  return answer.granted;
}

export function scheduleStillReading(date: number, bookTitle: string) {
  return Notifications.scheduleNotificationAsync({
    identifier: STILL_READING_ID,
    content: {
      title: i18n.t('reminders.stillReadingTitle'),
      body: i18n.t('reminders.stillReadingBody', { title: bookTitle }),
      data: { url: '/timer' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: CHANNEL_ID,
    },
  });
}

// When the timer is paused, finished or discarded
export function cancelStillReading() {
  void Notifications.cancelScheduledNotificationAsync(STILL_READING_ID);
}

export function scheduleDailyReminder(hour: number, minute: number) {
  return Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: i18n.t('reminders.dailyTitle'),
      body: i18n.t('reminders.dailyBody'),
      data: { url: '/' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

export function cancelDailyReminder() {
  void Notifications.cancelScheduledNotificationAsync(DAILY_ID);
}
