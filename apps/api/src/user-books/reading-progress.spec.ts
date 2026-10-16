import {
  dayWithBook,
  pagesLeft,
  progressFraction,
  ProgressUnit,
} from '@reading/shared';

function entry(
  progressUnit: ProgressUnit,
  currentProgress: number,
  book: { pageCount?: number | null; audioDurationMin?: number | null } = {},
) {
  return {
    progressUnit,
    currentProgress,
    book: {
      pageCount: book.pageCount ?? null,
      audioDurationMin: book.audioDurationMin ?? null,
    },
  };
}

describe('progressFraction', () => {
  it('uses the page count for pages', () => {
    expect(
      progressFraction(entry(ProgressUnit.PAGES, 92, { pageCount: 828 })),
    ).toBeCloseTo(0.111, 3);
  });

  it('uses 100 for percent', () => {
    expect(progressFraction(entry(ProgressUnit.PERCENT, 43))).toBe(0.43);
  });

  it('uses the audio duration for minutes', () => {
    expect(
      progressFraction(
        entry(ProgressUnit.MINUTES, 365, { audioDurationMin: 730 }),
      ),
    ).toBe(0.5);
  });

  it('returns null when the total is unknown', () => {
    expect(progressFraction(entry(ProgressUnit.PAGES, 50))).toBeNull();
  });

  it('never goes above 1', () => {
    expect(
      progressFraction(entry(ProgressUnit.PAGES, 900, { pageCount: 828 })),
    ).toBe(1);
  });
});

describe('pagesLeft', () => {
  it('counts the remaining pages', () => {
    expect(pagesLeft(entry(ProgressUnit.PAGES, 92, { pageCount: 828 }))).toBe(
      736,
    );
  });

  it('is null for percent-based progress', () => {
    expect(
      pagesLeft(entry(ProgressUnit.PERCENT, 43, { pageCount: 400 })),
    ).toBeNull();
  });
});

describe('dayWithBook', () => {
  it('is day 1 on the day the book was started', () => {
    const started = new Date(2026, 9, 16, 8, 0).toISOString();

    expect(dayWithBook(started, new Date(2026, 9, 16, 22, 0))).toBe(1);
  });

  it('counts calendar days, not 24-hour blocks', () => {
    const lateLastNight = new Date(2026, 9, 15, 23, 0).toISOString();

    expect(dayWithBook(lateLastNight, new Date(2026, 9, 16, 8, 0))).toBe(2);
  });

  it('counts across a month boundary', () => {
    const started = new Date(2026, 8, 30, 12, 0).toISOString();

    expect(dayWithBook(started, new Date(2026, 9, 2, 12, 0))).toBe(3);
  });
});
