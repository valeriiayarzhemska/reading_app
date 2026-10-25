import type {
  BookFormat,
  DatePrecision,
  ProgressUnit,
  ShelfStatus,
} from './enums.js';
import type { OwnReview } from './reviews.js';

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
  // Who added the book by hand (null for imported books, or if they left)
  createdById: string | null;
  // Over all readers' shelf entries; null until someone rates it
  ratingAvg: number | null;
  ratingCount: number;
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
  finishedPrecision: DatePrecision;
  createdAt: string;
  updatedAt: string;
  book: Book;
  review: OwnReview | null;
}
