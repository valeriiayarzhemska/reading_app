export const MESSAGE_MAX_LENGTH = 2000;
export const MESSAGES_PAGE_SIZE = 30;
// The app shrinks photos to ~1280 px JPEGs (a few hundred KB)
export const CHAT_PHOTO_MAX_BYTES = 3 * 1024 * 1024;

// The reactions on offer: a fixed set keeps it simple
export const CHAT_REACTIONS = ['💜', '🔥', '😂', '😮', '😢', '👍'] as const;

export type ChatReaction = (typeof CHAT_REACTIONS)[number];

// Who reacted with what. User ids, not "did I react": the server sends the
// same event to everyone, and each app finds itself in the list.
export interface MessageReactions {
  emoji: string;
  userIds: string[];
}

// The quoted message above a reply
export interface ReplyPreview {
  id: string;
  text: string;
  hasPhoto: boolean;
  authorNickname: string;
}

export interface ChatMessage {
  id: string;
  // Made by the sender's app; matches the optimistic bubble to the saved one
  clientId: string;
  clubId: string;
  // "" for a photo without a caption
  text: string;
  photoUrl: string | null;
  // null also when the original was deleted
  replyTo: ReplyPreview | null;
  // In the order they were first used
  reactions: MessageReactions[];
  createdAt: string;
  author: {
    id: string;
    nickname: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

// Socket.IO namespace and event names, shared so both sides spell them alike
export const CHAT_NAMESPACE = '/chat';

export const CHAT_EVENTS = {
  // app → server: start / stop getting a club's new messages
  join: 'club:join',
  leave: 'club:leave',
  // app → server, answered through the acknowledgement
  send: 'message:send',
  // app → server: add the emoji, or remove it if it's already yours
  react: 'message:react',
  // server → app: someone else's new message in a joined club
  new: 'message:new',
  // server → app: a message's reactions changed (to everyone in the room)
  reactions: 'message:reactions',
  // server → app: a new message in one of your clubs, for lists (unread
  // dots, "N a day"); sent whether or not that chat is open
  activity: 'club:activity',
} as const;

export interface ClubActivityEvent {
  clubId: string;
}

export interface JoinClubPayload {
  clubId: string;
}

export interface SendMessagePayload {
  clubId: string;
  clientId: string;
  // May be "" when photoUrl is set
  text: string;
  // From POST /uploads/chat-photo
  photoUrl?: string;
  replyToId?: string;
}

export interface ReactPayload {
  messageId: string;
  emoji: ChatReaction;
}

export interface ReactionsEvent {
  clubId: string;
  messageId: string;
  reactions: MessageReactions[];
}

// What the server answers to join / send / react, through the acknowledgement
export type ChatAck<T = void> =
  { ok: true; data: T } | { ok: false; error: string };
