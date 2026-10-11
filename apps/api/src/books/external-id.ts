import { BookSource } from '@reading/shared';

const ID_PATTERNS: Record<BookSource, RegExp> = {
  // Always 12 chars. Malformed IDs make Google answer 503 instead of 404.
  [BookSource.GOOGLE]: /^[A-Za-z0-9_-]{12}$/,
  // Open Library work: "OL17860744W"
  [BookSource.OPEN_LIBRARY]: /^OL\d+W$/,
};

export function isValidExternalId(source: BookSource, id: string): boolean {
  return ID_PATTERNS[source]?.test(id) ?? false;
}
