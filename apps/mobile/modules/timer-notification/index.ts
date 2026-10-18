import { requireOptionalNativeModule } from 'expo';

export interface TimerNotificationOptions {
  title: string;
  text: string;
  // startedAt + finished pauses, epoch ms: the chronometer counts up from it
  startedAtMs: number;
  paused: boolean;
  channelName: string;
}

interface TimerNotificationModule {
  show(options: TimerNotificationOptions): void;
  hide(): void;
}

// "Optional": null on iOS (the module is Android-only) instead of a crash
const native =
  requireOptionalNativeModule<TimerNotificationModule>('TimerNotification');

export function showTimerNotification(options: TimerNotificationOptions) {
  native?.show(options);
}

export function hideTimerNotification() {
  native?.hide();
}
