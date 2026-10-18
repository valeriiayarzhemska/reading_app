import { requireOptionalNativeModule, type NativeModule } from 'expo';

export interface TimerNotificationOptions {
  title: string;
  text: string;
  // startedAt + finished pauses, epoch ms: the chronometer counts up from it
  startedAtMs: number;
  paused: boolean;
  // 0–1, null when the book's length is unknown
  progress: number | null;
  // file:// path of the downloaded cover
  coverPath: string | null;
  channelName: string;
  pauseLabel: string;
  resumeLabel: string;
  finishLabel: string;
}

type TimerNotificationEvents = {
  // The notification's Pause/Resume button
  onToggle: () => void;
};

declare class TimerNotificationModule extends NativeModule<TimerNotificationEvents> {
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

export function addToggleListener(listener: () => void) {
  return native?.addListener('onToggle', listener) ?? { remove() {} };
}
