import type { DatePrecision } from './enums.js';

export const FAVORITES_MAX = 4;

export interface FavoriteBook {
  userBookId: string;
  title: string;
  coverUrl: string | null;
}

// GET /users/:nickname: what anyone signed in can see about a reader. No
// sessions, minutes or goals: those stay in the owner's "My reading".
export interface PublicProfile {
  id: string;
  nickname: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  links: string[];
  // The viewer's own profile: the app shows Edit instead of Follow
  isMe: boolean;
  currentlyReading: {
    userBookId: string;
    title: string;
    author: string;
    coverUrl: string | null;
    // 0–1, null when the book's length is unknown
    fraction: number | null;
    startedAt: string | null;
  } | null;
  stats: {
    // In the reader's timezone
    year: number;
    booksThisYear: number;
    booksRead: number;
    averageRating: number | null;
  };
  // In the order the reader chose, at most FAVORITES_MAX
  favorites: FavoriteBook[];
  // Newest first
  recentlyRead: {
    userBookId: string;
    title: string;
    coverUrl: string | null;
    rating: number | null;
    finishedAt: string;
    finishedPrecision: DatePrecision;
  }[];
}
