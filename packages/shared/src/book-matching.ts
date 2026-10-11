// \p{L} keeps letters of any alphabet, including Cyrillic
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

// Same title + first author = same book, whatever the source or edition
export function bookMatchKey(title: string, authors: string[]): string {
  return `${normalizeText(title)}|${normalizeText(authors[0] ?? '')}`;
}
