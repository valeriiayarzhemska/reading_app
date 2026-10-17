// A book on one calendar day, with what was read of it that day
export interface CalendarBook {
  userBookId: string;
  title: string;
  coverUrl: string | null;
  minutes: number;
  pages: number;
}

export interface CalendarDay {
  // "2026-10-17", in the reader's timezone
  date: string;
  minutes: number;
  pages: number;
  // In the order they were first opened that day
  books: CalendarBook[];
  // Books marked Read on this day (they may have no session that day)
  finished: CalendarBook[];
}

// GET /me/calendar?month=2026-10
export interface CalendarMonth {
  month: string;
  timezone: string;
  // Only days with reading or a finished book
  days: CalendarDay[];
  summary: {
    booksFinished: number;
    pages: number;
    minutes: number;
  };
}

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
