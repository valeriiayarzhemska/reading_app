// Each enum is a const object (runtime values) plus a type with the same name
// (the union of those values). Values are plain strings, so they match JSON
// from the API and the enums Prisma generates.

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
