export const NOTIFICATIONS_PAGE_SIZE = 30;

// Keep in sync with the NotificationType enum in schema.prisma
export const NotificationType = {
  FOLLOW: 'FOLLOW',
  POST_LIKE: 'POST_LIKE',
  POST_COMMENT: 'POST_COMMENT',
  COMMENT_LIKE: 'COMMENT_LIKE',
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export interface NotificationItem {
  id: string;
  type: NotificationType;
  createdAt: string;
  isRead: boolean;
  actor: {
    nickname: string;
    displayName: string;
    avatarUrl: string | null;
  };
  // Where a tap leads (FOLLOW: the actor's profile)
  postId: string | null;
  // A line of what was liked or written
  preview: string | null;
}

// server → app, to the recipient's personal room: refresh the 🔔 badge/list
export const NOTIFICATION_EVENT = 'notification:new';
