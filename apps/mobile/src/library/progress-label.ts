import { ShelfStatus, type UserBookWithBook } from '@reading/shared';
import type { TFunction } from 'i18next';
import { currentLanguage } from '@/i18n';
import { formatDate } from '@/lib/format';

// "page 92 of 828 · started October 8" for books being read
export function progressLabel(
  entry: UserBookWithBook,
  t: TFunction,
): string | undefined {
  if (entry.status !== ShelfStatus.READING) {
    return undefined;
  }

  const progress =
    entry.progressUnit === 'PERCENT'
      ? `${entry.currentProgress}%`
      : entry.book.pageCount
        ? t('library.progressPage', {
            current: entry.currentProgress,
            total: entry.book.pageCount,
          })
        : t('library.progressPageUnknownTotal', {
            current: entry.currentProgress,
          });

  if (!entry.startedAt) {
    return progress;
  }

  const started = t('library.startedOn', {
    date: formatDate(entry.startedAt, currentLanguage()),
  });

  return `${progress} · ${started}`;
}
