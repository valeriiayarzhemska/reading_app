// Limits for a book typed in by hand: checked by the form and the API
export const BOOK_TITLE_MAX_LENGTH = 300;
export const BOOK_AUTHOR_MAX_LENGTH = 200;
export const BOOK_AUTHORS_MAX_COUNT = 5;
// The longest printed books are around 10–15k pages
export const BOOK_PAGE_COUNT_MAX = 20_000;
// The app shrinks covers to ~700 px wide JPEGs (~100–300 KB); this only
// stops something clearly wrong from being uploaded
export const COVER_MAX_BYTES = 2 * 1024 * 1024;

export interface CoverUpload {
  // Presigned: PUT the file here within a few minutes, no other auth needed
  uploadUrl: string;
  // Where the file will be readable afterwards; send it as the book's coverUrl
  publicUrl: string;
}
