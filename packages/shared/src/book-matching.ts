// "Sarah J. Maas" and "Sarah J Maas" → "sarahjmaas". \p{L} keeps Cyrillic.
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

// Same title + same first author = same book, whatever the source or edition.
// Used by the API (merging, deduping) and the app ("On shelf ✓").
export function bookMatchKey(title: string, authors: string[]): string {
  return `${normalizeText(title)}|${normalizeText(authors[0] ?? '')}`;
}
