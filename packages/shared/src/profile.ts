// Used by the app (instant feedback while typing) and the API (enforcement)

export const NICKNAME_MIN_LENGTH = 3;
export const NICKNAME_MAX_LENGTH = 30;
export const DISPLAY_NAME_MAX_LENGTH = 50;
export const BIO_MAX_LENGTH = 160;
export const LINKS_MAX_COUNT = 3;

export type NicknameError =
  'tooShort' | 'tooLong' | 'invalidCharacters' | 'edgeSymbol';

// Stored lowercase, so "Alice" and "alice" can't be two different people
export function normalizeNickname(value: string): string {
  return value.trim().toLowerCase();
}

export function nicknameError(nickname: string): NicknameError | null {
  if (nickname.length < NICKNAME_MIN_LENGTH) {
    return 'tooShort';
  }

  if (nickname.length > NICKNAME_MAX_LENGTH) {
    return 'tooLong';
  }

  if (!/^[a-z0-9._]+$/.test(nickname)) {
    return 'invalidCharacters';
  }

  if (/^[._]|[._]$/.test(nickname)) {
    return 'edgeSymbol';
  }

  return null;
}

export const LINK_MAX_LENGTH = 200;

export type LinkError = 'notHttps' | 'invalid' | 'tooLong';

export function linkError(link: string): LinkError | null {
  if (link.length > LINK_MAX_LENGTH) {
    return 'tooLong';
  }

  if (!link.startsWith('https://')) {
    return 'notHttps';
  }

  // A host with a dot and no spaces: "https://instagram.com/vale.arw"
  if (!/^https:\/\/[^\s/]+\.[^\s/]+(\/\S*)?$/.test(link)) {
    return 'invalid';
  }

  return null;
}

// "Valeriia Yarzhemska" → "valeriia.yarzhemska"; "" when nothing usable is left
// (e.g. a name written only in Cyrillic)
export function suggestNickname(name: string): string {
  const suggestion = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._]/g, '')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, NICKNAME_MAX_LENGTH)
    .replace(/[._]+$/, '');

  return nicknameError(suggestion) ? '' : suggestion;
}
