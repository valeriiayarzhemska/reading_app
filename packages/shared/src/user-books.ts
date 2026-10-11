import type { BookFormat, ProgressUnit, ShelfStatus } from './enums.js';

// Shapes as they arrive over JSON: dates are ISO strings, not Date objects

export interface Book {
  id: string;
  googleBooksId: string | null;
  openLibraryId: string | null;
  title: string;
  authors: string[];
  coverUrl: string | null;
  pageCount: number | null;
  audioDurationMin: number | null;
  language: string | null;
  createdAt: string;
}

export interface UserBookWithBook {
  id: string;
  userId: string;
  bookId: string;
  status: ShelfStatus;
  format: BookFormat;
  progressUnit: ProgressUnit;
  currentProgress: number;
  rating: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  book: Book;
}
