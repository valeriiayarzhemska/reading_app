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

// GET /me/calendar/year?year=2026: the heatmap
export interface CalendarYear {
  year: number;
  timezone: string;
  // Only days with reading: { "2026-10-03": 155 }
  minutesByDay: Record<string, number>;
  summary: {
    booksFinished: number;
    minutes: number;
  };
}

export const YEAR_PATTERN = /^\d{4}$/;

// Heatmap color level of a day: fixed steps (like GitHub's contribution
// graph) read better at a glance than a smooth gradient
export const HEAT_LEVELS = [1, 15, 30, 60] as const;

// 0 = no reading … 4 = an hour or more
export function heatLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  const level = HEAT_LEVELS.filter((threshold) => minutes >= threshold).length;

  return level as 0 | 1 | 2 | 3 | 4;
}
