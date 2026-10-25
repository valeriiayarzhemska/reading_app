import type { TFunction } from 'i18next';

import { currentLanguage } from '@/i18n';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// "now", "4 min", "2 h", "3 d", then a date ("12 Oct"). `now` comes from the
// caller: reading the clock during render would make it impure.
export function timeAgo(iso: string, now: number, t: TFunction): string {
  const elapsed = now - new Date(iso).getTime();

  if (elapsed < MINUTE) {
    return t('time.now');
  }

  if (elapsed < HOUR) {
    return t('time.minutes', { count: Math.floor(elapsed / MINUTE) });
  }

  if (elapsed < DAY) {
    return t('time.hours', { count: Math.floor(elapsed / HOUR) });
  }

  if (elapsed < 7 * DAY) {
    return t('time.days', { count: Math.floor(elapsed / DAY) });
  }

  return new Intl.DateTimeFormat(currentLanguage(), {
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}
