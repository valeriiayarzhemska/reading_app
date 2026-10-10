import type { BookSearchResult } from '@reading/shared';
import type { GoogleVolume } from './google-books.types.js';

export function mapVolume(volume: GoogleVolume): BookSearchResult {
  const info = volume.volumeInfo;

  return {
    googleBooksId: volume.id,
    title: info.title ?? 'Untitled',
    authors: info.authors ?? [],
    coverUrl: normalizeCoverUrl(
      info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail,
    ),
    // Google sometimes reports 0 pages when it doesn't know
    pageCount: info.pageCount && info.pageCount > 0 ? info.pageCount : null,
    language: info.language ?? null,
  };
}

// Google returns http:// links (blocked by iOS) with a fake page-curl effect.
export function normalizeCoverUrl(url: string | undefined): string | null {
  if (!url) {
    return null;
  }
  return url.replace(/^http:\/\//, 'https://').replace('&edge=curl', '');
}
