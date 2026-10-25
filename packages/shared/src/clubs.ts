export const CLUB_NAME_MAX = 60;
export const CLUB_DESCRIPTION_MAX = 300;

// The "room colour" swatches; the first is the default
export const CLUB_COLORS = [
  '#E8907A',
  '#86A3C9',
  '#9C86D8',
  '#8DC4A0',
  '#C9A867',
  '#B6A6E8',
] as const;

export type ClubColor = (typeof CLUB_COLORS)[number];

export interface ClubBook {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  pageCount: number | null;
}

// A row in My / All
export interface ClubSummary {
  id: string;
  name: string;
  color: string;
  membersCount: number;
  // "Reading together", if the host chose a book
  book: ClubBook | null;
  host: { nickname: string; avatarUrl: string | null };
  isMember: boolean;
  // "34 a day": messages in the last 24 hours (0 shows "quiet")
  messagesToday: number;
  // Others' messages since you last opened the chat (0 when not a member)
  unreadCount: number;
}

// GET /clubs/:id: the join sheet and About the room
export interface ClubDetail extends ClubSummary {
  description: string | null;
  host: { nickname: string; displayName: string; avatarUrl: string | null };
  isHost: boolean;
  createdAt: string;
}

// POST /clubs
export interface ClubInput {
  name: string;
  description: string | null;
  color: ClubColor;
}
