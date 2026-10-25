export const FOLLOWS_PAGE_SIZE = 20;

export type FollowList = 'followers' | 'following';

// A row in a followers / following list
export interface ReaderSummary {
  id: string;
  nickname: string;
  displayName: string;
  avatarUrl: string | null;
  // Whether the viewer follows this reader: the row's button state
  isFollowing: boolean;
  isMe: boolean;
}

// One page of a list. nextCursor goes into ?cursor= for the next page; null
// means this was the last one.
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
