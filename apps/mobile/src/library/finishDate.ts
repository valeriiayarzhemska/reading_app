import { DatePrecision } from '@reading/shared';

import type { Language } from '@/i18n';
import { formatDate } from '@/lib/format';

export interface FinishChoice {
  precision: DatePrecision;
  // Used for DAY
  date: Date;
  // Used for MONTH and YEAR
  year: number;
  // 0–11, used for MONTH
  month: number;
}

// The date to store for what the reader picked. Inexact dates sit in the
// middle of their range (MONTH → the 15th, YEAR → 1 July), all at noon:
// converting noon to UTC can't move it into another day in any timezone.
export function finishDateFor(choice: FinishChoice): Date {
  if (choice.precision === DatePrecision.MONTH) {
    return new Date(choice.year, choice.month, 15, 12);
  }

  if (choice.precision === DatePrecision.YEAR) {
    return new Date(choice.year, 6, 1, 12);
  }

  const { date } = choice;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

// "15 September 2021" / "≈ September 2021" / "≈ 2021"
export function formatFinishDate(
  iso: string,
  precision: DatePrecision,
  language: Language,
): string {
  const date = new Date(iso);

  if (precision === DatePrecision.YEAR) {
    return `≈ ${date.getFullYear()}`;
  }

  if (precision === DatePrecision.MONTH) {
    return `≈ ${new Intl.DateTimeFormat(language, {
      month: 'long',
      year: 'numeric',
    }).format(date)}`;
  }

  return formatDate(iso, language);
}

// The year chips: this year and the four before it
export function recentYears(now: Date, count = 5): number[] {
  return Array.from({ length: count }, (_, i) => now.getFullYear() - i);
}

// ["січ", "лют", …] / ["Jan", "Feb", …], without the trailing dot some
// languages add to abbreviations
export function shortMonthNames(language: Language): string[] {
  const format = new Intl.DateTimeFormat(language, { month: 'short' });

  return Array.from({ length: 12 }, (_, month) =>
    format.format(new Date(2026, month, 1)).replace(/\.$/, ''),
  );
}
