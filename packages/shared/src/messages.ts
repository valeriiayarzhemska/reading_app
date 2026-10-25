export const MESSAGE_MAX_LENGTH = 2000;
export const MESSAGES_PAGE_SIZE = 30;

export interface ChatMessage {
  id: string;
  // Made by the sender's app; matches the optimistic bubble to the saved one
  clientId: string;
  clubId: string;
  text: string;
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
  // server → app: someone else's new message in a joined club
  new: 'message:new',
} as const;

export interface JoinClubPayload {
  clubId: string;
}

export interface SendMessagePayload {
  clubId: string;
  clientId: string;
  text: string;
}

// What the server answers to join / send, through the acknowledgement
export type ChatAck<T = void> =
  { ok: true; data: T } | { ok: false; error: string };
