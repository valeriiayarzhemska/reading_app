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
