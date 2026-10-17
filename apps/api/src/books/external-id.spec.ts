import { BookSource } from '@reading/shared';

import { isValidExternalId } from './external-id.js';

describe('isValidExternalId', () => {
  it('accepts a 12-char Google ID', () => {
    expect(isValidExternalId(BookSource.GOOGLE, '9pQQDQAAQBAJ')).toBe(true);
  });

  it('rejects a malformed Google ID', () => {
    expect(isValidExternalId(BookSource.GOOGLE, 'PASTE_ID_HERE')).toBe(false);
  });

  it('accepts an Open Library work ID', () => {
    expect(isValidExternalId(BookSource.OPEN_LIBRARY, 'OL17860744W')).toBe(
      true,
    );
  });

  it('rejects an Open Library edition ID (ends with M, not W)', () => {
    expect(isValidExternalId(BookSource.OPEN_LIBRARY, 'OL7353617M')).toBe(
      false,
    );
  });

  it('rejects a Google ID sent as Open Library', () => {
    expect(isValidExternalId(BookSource.OPEN_LIBRARY, '9pQQDQAAQBAJ')).toBe(
      false,
    );
  });
});
