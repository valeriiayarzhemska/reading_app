import type { TFunction } from 'i18next';

import type { Language } from '@/i18n';

// "October 8" / "8 жовтня"; the year only when it isn't the current one
export function formatDate(iso: string, language: Language): string {
  const date = new Date(iso);
  const isThisYear = date.getFullYear() === new Date().getFullYear();

  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'long',
    year: isThisYear ? undefined : 'numeric',
  }).format(date);
}

// 588 → "9 h 48 min" / "9 год 48 хв", 45 → "45 min"
export function formatDuration(minutes: number, t: TFunction): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return hours > 0
    ? t('common.duration.hoursMinutes', { hours, minutes: rest })
    : t('common.duration.minutes', { minutes: rest });
}

// "2026-10" → "October" / "Жовтень" (capitalized: Ukrainian month names aren't)
export function formatMonth(month: string, language: Language): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const name = new Intl.DateTimeFormat(language, { month: 'long' }).format(
    new Date(year, monthNumber - 1, 1),
  );

  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ["Mon", …, "Sun"] / ["пн", …, "нд"], Monday first
export function weekdayNames(language: Language): string[] {
  const format = new Intl.DateTimeFormat(language, { weekday: 'short' });

  // 5 January 2026 is a Monday
  return Array.from({ length: 7 }, (_, i) =>
    format.format(new Date(2026, 0, 5 + i)),
  );
}
