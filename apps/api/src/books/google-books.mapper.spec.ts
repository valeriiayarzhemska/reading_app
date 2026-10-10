import { mapVolume, normalizeCoverUrl } from './google-books.mapper.js';

describe('mapVolume', () => {
  it('maps a complete volume', () => {
    const result = mapVolume({
      id: 'abc123',
      volumeInfo: {
        title: 'Двір крил і руїн',
        authors: ['Сара Дж. Маас'],
        pageCount: 768,
        language: 'uk',
        imageLinks: {
          thumbnail:
            'http://books.google.com/books/content?id=abc123&zoom=1&edge=curl',
        },
      },
    });

    expect(result).toEqual({
      googleBooksId: 'abc123',
      title: 'Двір крил і руїн',
      authors: ['Сара Дж. Маас'],
      coverUrl: 'https://books.google.com/books/content?id=abc123&zoom=1',
      pageCount: 768,
      language: 'uk',
    });
  });

  it('fills safe defaults when fields are missing', () => {
    const result = mapVolume({ id: 'empty', volumeInfo: {} });

    expect(result).toEqual({
      googleBooksId: 'empty',
      title: 'Untitled',
      authors: [],
      coverUrl: null,
      pageCount: null,
      language: null,
    });
  });

  it('treats pageCount 0 as unknown', () => {
    const result = mapVolume({ id: 'x', volumeInfo: { pageCount: 0 } });
    expect(result.pageCount).toBeNull();
  });
});

describe('normalizeCoverUrl', () => {
  it('returns null for a missing url', () => {
    expect(normalizeCoverUrl(undefined)).toBeNull();
  });

  it('keeps https urls untouched', () => {
    const url = 'https://example.com/cover.jpg';
    expect(normalizeCoverUrl(url)).toBe(url);
  });
});
