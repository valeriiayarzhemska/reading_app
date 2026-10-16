import {
  BookFormat,
  progressError,
  ProgressUnit,
  ShelfStatus,
} from '@reading/shared';

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

// The rule lives in packages/shared (the app checks it too); this turns its
// error code into the API's message
export function validateProgress(
  unit: ProgressUnit,
  progress: number,
  pageCount: number | null,
): string | null {
  const error = progressError(unit, progress, pageCount);

  if (error === 'overPercent') {
    return 'Progress cannot exceed 100%';
  }

  if (error === 'overPages') {
    return `Progress cannot exceed the book's ${pageCount} pages`;
  }

  return null;
}
