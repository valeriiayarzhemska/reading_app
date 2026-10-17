import { describe, expect, it } from 'vitest';

import { buildCalendar, monthRange, type BookInfo } from './calendar.js';

const books = new Map<string, BookInfo>([
  ['a', { title: 'Book A', coverUrl: 'a.jpg' }],
  ['b', { title: 'Book B', coverUrl: null }],
]);

describe('monthRange', () => {
  it('returns the month and the first day after it', () => {
    expect(monthRange('2026-10')).toEqual(['2026-10-01', '2026-11-01']);
  });

  it('rolls over to January', () => {
    expect(monthRange('2026-12')).toEqual(['2026-12-01', '2027-01-01']);
  });
});

describe('buildCalendar', () => {
  it('groups books under their days and sums the day', () => {
    const calendar = buildCalendar(
      '2026-10',
      'Europe/Kyiv',
      [
        { day: '2026-10-03', userBookId: 'a', seconds: 3600, pages: 40 },
        { day: '2026-10-03', userBookId: 'b', seconds: 1800, pages: 20 },
        { day: '2026-10-05', userBookId: 'a', seconds: 600, pages: 8 },
      ],
      [],
      books,
    );

    expect(calendar.days.map((day) => day.date)).toEqual([
      '2026-10-03',
      '2026-10-05',
    ]);
    expect(calendar.days[0]).toMatchObject({ minutes: 90, pages: 60 });
    expect(calendar.days[0].books.map((book) => book.title)).toEqual([
      'Book A',
      'Book B',
    ]);
    expect(calendar.summary).toEqual({
      booksFinished: 0,
      pages: 68,
      minutes: 100,
    });
  });

  it('adds a day for a book finished without a session that day', () => {
    const calendar = buildCalendar(
      '2026-10',
      'Europe/Kyiv',
      [],
      [{ day: '2026-10-09', userBookId: 'b' }],
      books,
    );

    expect(calendar.days).toHaveLength(1);
    expect(calendar.days[0].finished[0].title).toBe('Book B');
    expect(calendar.summary.booksFinished).toBe(1);
  });
});
