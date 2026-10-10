import { BookFormat, ProgressUnit, ShelfStatus } from '@reading/shared';
import {
  datesForStatus,
  defaultProgressUnit,
  validateProgress,
} from './user-books.rules.js';

const NOW = new Date('2026-10-10T12:00:00Z');
const EARLIER = new Date('2026-09-01T08:00:00Z');

describe('defaultProgressUnit', () => {
  it('uses minutes for audiobooks', () => {
    expect(defaultProgressUnit(BookFormat.AUDIO)).toBe(ProgressUnit.MINUTES);
  });

  it('uses pages for paper and ebooks', () => {
    expect(defaultProgressUnit(BookFormat.PAPER)).toBe(ProgressUnit.PAGES);
    expect(defaultProgressUnit(BookFormat.EBOOK)).toBe(ProgressUnit.PAGES);
  });
});

describe('datesForStatus', () => {
  it('sets startedAt when a book becomes READING for the first time', () => {
    expect(datesForStatus(ShelfStatus.READING, null, NOW)).toEqual({
      startedAt: NOW,
    });
  });

  it('keeps the original startedAt when READING again', () => {
    const current = { startedAt: EARLIER, finishedAt: null };
    expect(datesForStatus(ShelfStatus.READING, current, NOW)).toEqual({});
  });

  it('sets finishedAt when a book becomes READ', () => {
    const current = { startedAt: EARLIER, finishedAt: null };
    expect(datesForStatus(ShelfStatus.READ, current, NOW)).toEqual({
      finishedAt: NOW,
    });
  });

  it('changes nothing for WANT_TO_READ, ABANDONED or no status', () => {
    expect(datesForStatus(ShelfStatus.WANT_TO_READ, null, NOW)).toEqual({});
    expect(datesForStatus(ShelfStatus.ABANDONED, null, NOW)).toEqual({});
    expect(datesForStatus(undefined, null, NOW)).toEqual({});
  });
});

describe('validateProgress', () => {
  it('rejects more than 100%', () => {
    expect(validateProgress(ProgressUnit.PERCENT, 101, null)).not.toBeNull();
  });

  it('accepts exactly 100%', () => {
    expect(validateProgress(ProgressUnit.PERCENT, 100, null)).toBeNull();
  });

  it('rejects more pages than the book has', () => {
    expect(validateProgress(ProgressUnit.PAGES, 769, 768)).not.toBeNull();
  });

  it('accepts any page when the page count is unknown', () => {
    expect(validateProgress(ProgressUnit.PAGES, 5000, null)).toBeNull();
  });

  it('accepts any number of minutes', () => {
    expect(validateProgress(ProgressUnit.MINUTES, 900, 300)).toBeNull();
  });
});
