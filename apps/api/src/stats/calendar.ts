import type { CalendarBook, CalendarDay, CalendarMonth } from '@reading/shared';

// One row per (day, book) from the GROUP BY query
export interface SessionDayRow {
  day: string;
  userBookId: string;
  seconds: number;
  pages: number;
}

export interface FinishedRow {
  day: string;
  userBookId: string;
}

export interface BookInfo {
  title: string;
  coverUrl: string | null;
}

// "2026-10" → ["2026-10-01", "2026-11-01"]: the month's first day and the
// first day after it, as local dates (the SQL turns them into UTC moments)
export function monthRange(month: string): [string, string] {
  const [year, monthNumber] = month.split('-').map(Number);
  const next =
    monthNumber === 12
      ? `${year + 1}-01`
      : `${year}-${String(monthNumber + 1).padStart(2, '0')}`;

  return [`${month}-01`, `${next}-01`];
}

export function buildCalendar(
  month: string,
  timezone: string,
  sessions: SessionDayRow[],
  finished: FinishedRow[],
  books: Map<string, BookInfo>,
): CalendarMonth {
  const days = new Map<string, CalendarDay>();
  const dayFor = (date: string) => {
    const day = days.get(date) ?? {
      date,
      minutes: 0,
      pages: 0,
      books: [],
      finished: [],
    };

    days.set(date, day);

    return day;
  };
  const bookFor = (userBookId: string, minutes: number, pages: number) => {
    const info = books.get(userBookId);

    return {
      userBookId,
      title: info?.title ?? '',
      coverUrl: info?.coverUrl ?? null,
      minutes,
      pages,
    } satisfies CalendarBook;
  };

  for (const row of sessions) {
    const day = dayFor(row.day);
    const minutes = Math.round(row.seconds / 60);

    day.minutes += minutes;
    day.pages += row.pages;
    day.books.push(bookFor(row.userBookId, minutes, row.pages));
  }

  for (const row of finished) {
    dayFor(row.day).finished.push(bookFor(row.userBookId, 0, 0));
  }

  const sorted = [...days.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return {
    month,
    timezone,
    days: sorted,
    summary: {
      booksFinished: finished.length,
      pages: sorted.reduce((sum, day) => sum + day.pages, 0),
      minutes: sorted.reduce((sum, day) => sum + day.minutes, 0),
    },
  };
}
