// const objects instead of TS enums: plain strings that match JSON and Prisma

export const ShelfStatus = {
  WANT_TO_READ: 'WANT_TO_READ',
  READING: 'READING',
  READ: 'READ',
  ABANDONED: 'ABANDONED',
} as const;
export type ShelfStatus = (typeof ShelfStatus)[keyof typeof ShelfStatus];

export const BookFormat = {
  PAPER: 'PAPER',
  EBOOK: 'EBOOK',
  AUDIO: 'AUDIO',
} as const;
export type BookFormat = (typeof BookFormat)[keyof typeof BookFormat];

export const ProgressUnit = {
  PAGES: 'PAGES',
  PERCENT: 'PERCENT',
  MINUTES: 'MINUTES',
} as const;
export type ProgressUnit = (typeof ProgressUnit)[keyof typeof ProgressUnit];

// Where a search result comes from. Not stored in the DB: a saved Book keeps
// the ID of each source in its own column (googleBooksId / openLibraryId).
export const BookSource = {
  OPEN_LIBRARY: 'OPEN_LIBRARY',
  GOOGLE: 'GOOGLE',
} as const;
export type BookSource = (typeof BookSource)[keyof typeof BookSource];
