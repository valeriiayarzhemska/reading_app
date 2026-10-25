import type { CollectionSummary } from './collections.js';
import type { DatePrecision } from './enums.js';
import type { ProfileReview } from './reviews.js';

export const FAVORITES_MAX = 4;
export const PROFILE_REVIEWS_LIMIT = 3;

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
  // Whether the viewer follows this reader (false on your own profile)
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
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
  // Newest first, all of them
  collections: CollectionSummary[];
  // Newest first, at most PROFILE_REVIEWS_LIMIT
  reviews: ProfileReview[];
  reviewsCount: number;
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
