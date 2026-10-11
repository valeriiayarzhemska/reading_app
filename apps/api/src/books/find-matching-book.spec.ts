import { findMatchingBook } from './find-matching-book.js';

const seededFromGoogle = {
  id: 'google-row',
  title: 'A Court of Mist and Fury',
  authors: ['Sarah J. Maas'],
};

describe('findMatchingBook', () => {
  it('finds the same book saved from another source', () => {
    const match = findMatchingBook([seededFromGoogle], {
      title: 'A Court of Mist and Fury',
      authors: ['Sarah J Maas'],
    });

    expect(match?.id).toBe('google-row');
  });

  it('ignores case and punctuation in the title', () => {
    const match = findMatchingBook([seededFromGoogle], {
      title: 'a court of mist and fury!',
      authors: ['Sarah J. Maas'],
    });

    expect(match?.id).toBe('google-row');
  });

  it('treats "&" and "and" as different (known limitation)', () => {
    const match = findMatchingBook([seededFromGoogle], {
      title: 'A Court of Mist & Fury',
      authors: ['Sarah J. Maas'],
    });

    expect(match).toBeUndefined();
  });

  it('matches Cyrillic titles with different apostrophes', () => {
    const saved = {
      id: 'uk-row',
      title: "Сім чоловіків Евелін Г'юго",
      authors: ['Тейлор Дженкінс Рід'],
    };

    const match = findMatchingBook([saved], {
      title: 'Сім чоловіків Евелін Г’юго',
      authors: ['Тейлор Дженкінс Рід'],
    });

    expect(match?.id).toBe('uk-row');
  });

  it('does not match the same title by another author', () => {
    const match = findMatchingBook([seededFromGoogle], {
      title: 'A Court of Mist and Fury',
      authors: ['Study Guide Press'],
    });

    expect(match).toBeUndefined();
  });

  it('returns undefined when there are no candidates', () => {
    expect(findMatchingBook([], seededFromGoogle)).toBeUndefined();
  });
});
