import { BookFormat, ProgressUnit, ShelfStatus } from '@reading/shared';

export function defaultProgressUnit(format: BookFormat): ProgressUnit {
  return format === BookFormat.AUDIO
    ? ProgressUnit.MINUTES
    : ProgressUnit.PAGES;
}

interface ShelfDates {
  startedAt: Date | null;
  finishedAt: Date | null;
}

// Which dates to set when the status changes. Existing dates are never
// overwritten: moving READING → WANT_TO_READ → READING keeps the first start.
export function datesForStatus(
  status: ShelfStatus | undefined,
  current: ShelfDates | null,
  now = new Date(),
): Partial<ShelfDates> {
  if (status === ShelfStatus.READING && !current?.startedAt) {
    return { startedAt: now };
  }

  if (status === ShelfStatus.READ && !current?.finishedAt) {
    return { finishedAt: now };
  }

  return {};
}

// Returns an error message, or null when valid
export function validateProgress(
  unit: ProgressUnit,
  progress: number,
  pageCount: number | null,
): string | null {
  if (unit === ProgressUnit.PERCENT && progress > 100) {
    return 'Progress cannot exceed 100%';
  }

  if (
    unit === ProgressUnit.PAGES &&
    pageCount !== null &&
    progress > pageCount
  ) {
    return `Progress cannot exceed the book's ${pageCount} pages`;
  }

  return null;
}
