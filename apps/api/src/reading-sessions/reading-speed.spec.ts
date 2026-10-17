import { describe, expect, it } from 'vitest';

import {
  minutesLeft,
  ProgressUnit,
  readingSpeed,
  type SpeedSession,
} from '@reading/shared';

function session(overrides: Partial<SpeedSession>): SpeedSession {
  return {
    userBookId: 'a',
    unit: ProgressUnit.PAGES,
    progressFrom: 0,
    progressTo: 30,
    durationSec: 30 * 60,
    pageCount: 300,
    ...overrides,
  };
}

describe('readingSpeed', () => {
  it('counts pages per hour, per book and overall', () => {
    const speed = readingSpeed([
      session({ userBookId: 'a', progressTo: 30, durationSec: 30 * 60 }),
      session({ userBookId: 'b', progressTo: 20, durationSec: 30 * 60 }),
    ]);

    expect(speed.byBook).toEqual({ a: 60, b: 40 });
    expect(speed.overall).toBe(50);
  });

  it('converts percent sessions to pages', () => {
    const speed = readingSpeed([
      session({ unit: ProgressUnit.PERCENT, progressTo: 10, pageCount: 400 }),
    ]);

    expect(speed.overall).toBe(80);
  });

  it('gives no speed until there is enough data', () => {
    const speed = readingSpeed([
      session({ progressTo: 10, durationSec: 10 * 60 }),
    ]);

    expect(speed).toEqual({ overall: null, byBook: {} });
  });

  it('ignores audiobook sessions', () => {
    const speed = readingSpeed([session({ unit: ProgressUnit.MINUTES })]);

    expect(speed.overall).toBe(null);
  });
});

describe('minutesLeft', () => {
  const entry = {
    id: 'a',
    progressUnit: ProgressUnit.PAGES,
    currentProgress: 240,
    book: { pageCount: 300, audioDurationMin: null },
  };

  it('uses the book speed first, then the overall one', () => {
    expect(minutesLeft(entry, { overall: 30, byBook: { a: 60 } })).toBe(60);
    expect(minutesLeft(entry, { overall: 30, byBook: {} })).toBe(120);
  });

  it('works for percent progress', () => {
    const percent = {
      ...entry,
      progressUnit: ProgressUnit.PERCENT,
      currentProgress: 50,
    };

    expect(minutesLeft(percent, { overall: 60, byBook: {} })).toBe(150);
  });

  it('is null without a speed or a page count', () => {
    expect(minutesLeft(entry, { overall: null, byBook: {} })).toBe(null);
    expect(
      minutesLeft(
        { ...entry, book: { pageCount: null, audioDurationMin: null } },
        { overall: 60, byBook: {} },
      ),
    ).toBe(null);
  });

  it('uses the audiobook length for audio', () => {
    expect(
      minutesLeft(
        {
          ...entry,
          progressUnit: ProgressUnit.MINUTES,
          currentProgress: 100,
          book: { pageCount: null, audioDurationMin: 400 },
        },
        undefined,
      ),
    ).toBe(300);
  });
});
