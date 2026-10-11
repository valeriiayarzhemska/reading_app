import { coverUrl, mapWork, workId } from './open-library.mapper.js';

describe('mapWork', () => {
  it('maps a complete work', () => {
    const result = mapWork({
      key: '/works/OL17860744W',
      title: 'A Court of Mist and Fury',
      author_name: ['Sarah J. Maas'],
      cover_i: 14315081,
      number_of_pages_median: 626,
    });

    expect(result).toEqual({
      source: 'OPEN_LIBRARY',
      externalId: 'OL17860744W',
      title: 'A Court of Mist and Fury',
      authors: ['Sarah J. Maas'],
      coverUrl: 'https://covers.openlibrary.org/b/id/14315081-M.jpg',
      pageCount: 626,
      language: null,
    });
  });

  it('fills safe defaults when fields are missing', () => {
    const result = mapWork({ key: '/works/OL1W' });

    expect(result).toEqual({
      source: 'OPEN_LIBRARY',
      externalId: 'OL1W',
      title: 'Untitled',
      authors: [],
      coverUrl: null,
      pageCount: null,
      language: null,
    });
  });
});

describe('workId', () => {
  it('strips the /works/ prefix', () => {
    expect(workId('/works/OL27482W')).toBe('OL27482W');
  });
});

describe('coverUrl', () => {
  it('returns null without a cover id', () => {
    expect(coverUrl(undefined)).toBeNull();
  });
});
