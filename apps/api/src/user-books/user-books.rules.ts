import {
  BookFormat,
  DatePrecision,
  progressError,
  ProgressUnit,
  ShelfStatus,
} from '@reading/shared';

export function defaultProgressUnit(format: BookFormat): ProgressUnit {
  return format === BookFormat.AUDIO
    ? ProgressUnit.MINUTES
    : ProgressUnit.PAGES;
}

interface ShelfState {
  status: ShelfStatus;
  startedAt: Date | null;
}

interface ShelfDates {
  startedAt: Date;
  finishedAt: Date | null;
  finishedPrecision: DatePrecision;
}

// Which dates change with a status change (current = null: a new shelf entry)
//   → READ       finishedAt = now: finishing again moves it to today
//   → READING    startedAt = now, only the first time: READING →
//                WANT_TO_READ → READING keeps the original start
// Leaving READ keeps finishedAt: the book was finished then, even if it's
// being reread now. Only an explicit finishedAt: null removes it.
export function datesForStatus(
  status: ShelfStatus | undefined,
  current: ShelfState | null,
  now = new Date(),
): Partial<ShelfDates> {
  if (!status || status === current?.status) {
    return {};
  }

  if (status === ShelfStatus.READ) {
    return { finishedAt: now, finishedPrecision: DatePrecision.DAY };
  }

  if (status === ShelfStatus.READING && !current?.startedAt) {
    return { startedAt: now };
  }

  return {};
}

// The phone's clock can be a bit ahead of the server's
const CLOCK_SKEW_MS = 5 * 60 * 1000;

// Dates the reader sets by hand ("finished in Sept 2021, started in July")
export function bookDatesError(
  startedAt: Date | null,
  finishedAt: Date | null,
  now = new Date(),
): string | null {
  const latest = now.getTime() + CLOCK_SKEW_MS;

  if (finishedAt && finishedAt.getTime() > latest) {
    return 'finishedAt cannot be in the future';
  }

  if (startedAt && startedAt.getTime() > latest) {
    return 'startedAt cannot be in the future';
  }

  if (startedAt && finishedAt && startedAt > finishedAt) {
    return 'startedAt cannot be after finishedAt';
  }

  return null;
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
