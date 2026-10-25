export const POST_MAX_LENGTH = 2000;
export const COMMENT_MAX_LENGTH = 1000;
export const POSTS_PAGE_SIZE = 20;
export const COMMENTS_PAGE_SIZE = 30;

// Subscriptions: people you follow, and you. All: everyone.
export type FeedKind = 'following' | 'all';

export interface PostAuthor {
  id: string;
  nickname: string;
  displayName: string;
  avatarUrl: string | null;
}

// A post in the feed and on its own screen. The viewer's own fields
// (likedByMe, onMyShelf, isMine) are fine: the feed is REST, every viewer
// gets their own answer.
export interface PostItem {
  id: string;
  text: string;
  photoUrl: string | null;
  createdAt: string;
  author: PostAuthor;
  book: {
    id: string;
    title: string;
    authors: string[];
    coverUrl: string | null;
    // "+ Want to read" or "On shelf ✓"
    onMyShelf: boolean;
  } | null;
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
  // Shown under the post in the feed
  latestComment: { authorNickname: string; text: string } | null;
  isMine: boolean;
}

export interface PostComment {
  id: string;
  text: string;
  createdAt: string;
  author: PostAuthor;
  likesCount: number;
  likedByMe: boolean;
}

// POST /posts. Text, a photo, or both; the book is optional.
export interface PostInput {
  text: string;
  bookId?: string;
  photoUrl?: string;
}
