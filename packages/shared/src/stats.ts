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

// GET /me/stats: the cards at the top of "My reading"
export interface StatsSummary {
  timezone: string;
  total: {
    minutes: number;
    pages: number;
    // Books on the Read shelf
    booksRead: number;
    // 1–10, one decimal; null until a book is rated
    averageRating: number | null;
  };
  // The current year in the reader's timezone
  year: {
    year: number;
    booksRead: number;
    minutes: number;
  };
  goal: ReadingGoal | null;
}

export interface ReadingGoal {
  year: number;
  // Books to finish that year
  target: number;
}

export const GOAL_TARGET_MAX = 1000;
