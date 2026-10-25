export const REVIEW_MAX_LENGTH = 2000;
export const REVIEWS_PAGE_SIZE = 20;

// Your own review, on your shelf entry
export interface OwnReview {
  text: string;
  hasSpoilers: boolean;
  updatedAt: string;
}

// A review on a book page: the full text, spoilers behind a tap in the app
export interface BookReview {
  id: string;
  text: string;
  hasSpoilers: boolean;
  // The author's rating of this book
  rating: number | null;
  createdAt: string;
  author: {
    nickname: string;
    displayName: string;
    avatarUrl: string | null;
  };
  isMine: boolean;
}

// A review on a profile. Spoiler texts are not sent at all (null): they
// open on the book page.
export interface ProfileReview {
  id: string;
  bookId: string;
  title: string;
  coverUrl: string | null;
  rating: number | null;
  text: string | null;
  hasSpoilers: boolean;
  createdAt: string;
}

// GET /books/:id: the public book page
export interface BookPage {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  pageCount: number | null;
  ratingAvg: number | null;
  ratingCount: number;
  reviewsCount: number;
  // Your shelf entry for this book, to open it instead of adding it again
  myEntryId: string | null;
}
