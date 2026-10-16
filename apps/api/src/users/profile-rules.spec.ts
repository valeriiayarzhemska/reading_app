import {
  linkError,
  nicknameError,
  normalizeNickname,
  suggestNickname,
} from '@reading/shared';

describe('nicknameError', () => {
  it.each(['alice', 'valeriia.yarzhemska', 'reader_42', 'abc', 'a'.repeat(30)])(
    'accepts %s',
    (nickname) => {
      expect(nicknameError(nickname)).toBeNull();
    },
  );

  it.each([
    ['ab', 'tooShort'],
    ['a'.repeat(31), 'tooLong'],
    ['alice!', 'invalidCharacters'],
    ['алиса', 'invalidCharacters'],
    ['al ice', 'invalidCharacters'],
    ['Alice', 'invalidCharacters'],
    ['.alice', 'edgeSymbol'],
    ['alice_', 'edgeSymbol'],
  ])('rejects %s as %s', (nickname, error) => {
    expect(nicknameError(nickname)).toBe(error);
  });
});

describe('normalizeNickname', () => {
  it('trims and lowercases, so Alice and alice are the same nickname', () => {
    expect(normalizeNickname('  Alice ')).toBe('alice');
  });
});

describe('suggestNickname', () => {
  it('builds a nickname from a full name', () => {
    expect(suggestNickname('Valeriia Yarzhemska')).toBe('valeriia.yarzhemska');
  });

  it('drops characters that are not allowed', () => {
    expect(suggestNickname("Mary-Jane O'Neil")).toBe('maryjane.oneil');
  });

  it('returns an empty string when nothing usable is left', () => {
    expect(suggestNickname('Валерія')).toBe('');
  });

  it('never ends with a separator after cutting to 30 characters', () => {
    const suggestion = suggestNickname(`${'a'.repeat(29)} bcd`);

    expect(suggestion.length).toBeLessThanOrEqual(30);
    expect(nicknameError(suggestion)).toBeNull();
  });
});

describe('linkError', () => {
  it.each([
    'https://instagram.com/vale.arw',
    'https://www.tiktok.com/@reader',
    'https://goodreads.com',
  ])('accepts %s', (link) => {
    expect(linkError(link)).toBeNull();
  });

  it.each([
    ['http://instagram.com/vale', 'notHttps'],
    ['instagram.com/vale', 'notHttps'],
    ['javascript:alert(1)', 'notHttps'],
    ['https://localhost', 'invalid'],
    ['https://insta gram.com', 'invalid'],
    [`https://a.com/${'x'.repeat(200)}`, 'tooLong'],
  ])('rejects %s as %s', (link, error) => {
    expect(linkError(link)).toBe(error);
  });
});
