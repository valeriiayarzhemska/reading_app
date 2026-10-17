import type { BookSearchResult } from '@reading/shared';
import {
  dedupe,
  isUseful,
  refineResults,
  sortByCompleteness,
  withLibraryBooks,
} from './search-results.js';

function book(overrides: Partial<BookSearchResult>): BookSearchResult {
  return {
    source: 'GOOGLE',
    externalId: 'id',
    title: 'A Court of Wings and Ruin',
    authors: ['Sarah J. Maas'],
    coverUrl: 'https://example.com/cover.jpg',
    pageCount: 700,
    language: 'en',
    ...overrides,
  };
}

describe('isUseful', () => {
  it('drops a result with no cover and no page count', () => {
    expect(isUseful(book({ coverUrl: null, pageCount: null }))).toBe(false);
  });

  it('keeps a result with only a cover', () => {
    expect(isUseful(book({ pageCount: null }))).toBe(true);
  });

  it('keeps a result with only a page count', () => {
    expect(isUseful(book({ coverUrl: null }))).toBe(true);
  });
});

describe('dedupe', () => {
  it('merges editions with the same title and author, keeping the most complete', () => {
    const result = dedupe([
      book({ externalId: 'noPages', pageCount: null }),
      book({ externalId: 'full' }),
    ]);
    expect(result.map((b) => b.externalId)).toEqual(['full']);
  });

  it('ignores case, spaces and punctuation in title and author', () => {
    const result = dedupe([
      book({ externalId: 'a', authors: ['Sarah J. Maas'] }),
      book({
        externalId: 'b',
        title: 'a court of wings and ruin',
        authors: ['Sarah J Maas'],
      }),
    ]);
    expect(result).toHaveLength(1);
  });

  it('keeps books with the same title by different authors', () => {
    const result = dedupe([
      book({ externalId: 'real' }),
      book({ externalId: 'study-guide', authors: ['Perfection Learning'] }),
    ]);
    expect(result).toHaveLength(2);
  });

  it('works with Cyrillic titles', () => {
    const result = dedupe([
      book({ externalId: 'a', title: 'Двір крил і руїн' }),
      book({ externalId: 'b', title: 'ДВІР КРИЛ І РУЇН!' }),
    ]);
    expect(result).toHaveLength(1);
  });

  it('keeps the position where the book first appeared', () => {
    const result = dedupe([
      book({ externalId: 'first', pageCount: null }),
      book({ externalId: 'other', title: 'Another book' }),
      book({ externalId: 'better' }),
    ]);
    expect(result.map((b) => b.externalId)).toEqual(['better', 'other']);
  });
});

describe('sortByCompleteness', () => {
  it('puts books with cover and pages first, keeping order among equals', () => {
    const result = sortByCompleteness([
      book({ externalId: 'pagesOnly', coverUrl: null }),
      book({ externalId: 'full1' }),
      book({ externalId: 'coverOnly', pageCount: null }),
      book({ externalId: 'full2' }),
    ]);
    expect(result.map((b) => b.externalId)).toEqual([
      'full1',
      'full2',
      'coverOnly',
      'pagesOnly',
    ]);
  });
});

describe('refineResults', () => {
  it('filters, merges and sorts in one pass', () => {
    const result = refineResults([
      book({
        externalId: 'junk',
        title: 'Notebook',
        coverUrl: null,
        pageCount: null,
      }),
      book({ externalId: 'edition1', pageCount: null }),
      book({ externalId: 'other', title: 'Another', coverUrl: null }),
      book({ externalId: 'edition2' }),
    ]);
    expect(result.map((b) => b.externalId)).toEqual(['edition2', 'other']);
  });
});

describe('withLibraryBooks', () => {
  it('puts library books after the catalogue', () => {
    const catalogue = [book({ externalId: 'a' })];
    const library = [
      book({ source: 'LIBRARY', externalId: 'b', title: 'Grandma Diary' }),
    ];

    expect(
      withLibraryBooks(catalogue, library).map((result) => result.externalId),
    ).toEqual(['a', 'b']);
  });

  it('drops a library book the catalogue already has', () => {
    const catalogue = [book({ externalId: 'a' })];
    const library = [
      book({
        source: 'LIBRARY',
        externalId: 'b',
        title: 'a court of wings and ruin',
      }),
    ];

    expect(withLibraryBooks(catalogue, library)).toEqual(catalogue);
  });
});
