import { useEffect } from 'react';

import { randomUUID } from 'expo-crypto';

import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';

import {
  CHAT_EVENTS,
  type ChatAck,
  type ChatMessage,
  type ChatReaction,
  type MessageDeletedEvent,
  type MessageReactions,
  type Page,
  type ReactionsEvent,
} from '@reading/shared';

import { apiFetch } from '@/api/client';
import { uploadChatPhoto } from '@/api/uploads';
import { useAuth } from '@/auth/AuthContext';
import { getChatSocket } from '@/chat/chatSocket';
import { clearUnread, setOpenChat } from '@/chat/useClubActivity';

const SEND_TIMEOUT_MS = 10_000;

// Saved messages have no status; the sender's own bubble has one until the
// server confirms it
export interface ChatItem extends ChatMessage {
  status?: 'sending' | 'failed';
  // A photo still on the phone: shown at once, uploaded before sending
  localPhotoUri?: string;
}

export interface ChatDraft {
  text: string;
  localPhotoUri?: string;
  replyTo?: ChatItem;
}

type ChatPages = InfiniteData<Page<ChatItem>, string | null>;

export const messagesKey = (clubId: string) => ['messages', clubId] as const;

// New messages go to the front of the first page (pages are newest first)
function insertMessage(
  queryClient: QueryClient,
  clubId: string,
  message: ChatItem,
) {
  queryClient.setQueryData<ChatPages>(messagesKey(clubId), (data) => {
    if (!data) {
      return data;
    }

    const [first, ...rest] = data.pages;

    // Already there: the optimistic bubble and the saved message share clientId
    if (first.items.some((item) => item.clientId === message.clientId)) {
      return data;
    }

    return {
      ...data,
      pages: [{ ...first, items: [message, ...first.items] }, ...rest],
    };
  });
}

// Changes one message wherever it is: a reaction can land on an old one
function updateMessage(
  queryClient: QueryClient,
  clubId: string,
  matches: (item: ChatItem) => boolean,
  update: (item: ChatItem) => ChatItem,
) {
  queryClient.setQueryData<ChatPages>(messagesKey(clubId), (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              matches(item) ? update(item) : item,
            ),
          })),
        }
      : data,
  );
}

// Gone from whichever loaded page holds it
function removeMessage(
  queryClient: QueryClient,
  clubId: string,
  messageId: string,
) {
  queryClient.setQueryData<ChatPages>(messagesKey(clubId), (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== messageId),
          })),
        }
      : data,
  );
}

function replaceMessage(
  queryClient: QueryClient,
  clubId: string,
  next: ChatItem,
) {
  updateMessage(
    queryClient,
    clubId,
    (item) => item.clientId === next.clientId,
    () => next,
  );
}

function setReactions(
  queryClient: QueryClient,
  clubId: string,
  messageId: string,
  reactions: MessageReactions[],
) {
  updateMessage(
    queryClient,
    clubId,
    (item) => item.id === messageId,
    (item) => ({ ...item, reactions }),
  );
}

// The same toggle the server does, applied locally for an instant reaction
function toggled(
  reactions: MessageReactions[],
  emoji: string,
  userId: string,
): MessageReactions[] {
  const group = reactions.find((reaction) => reaction.emoji === emoji);

  if (!group) {
    return [...reactions, { emoji, userIds: [userId] }];
  }

  const userIds = group.userIds.includes(userId)
    ? group.userIds.filter((id) => id !== userId)
    : [...group.userIds, userId];

  return reactions
    .map((reaction) =>
      reaction.emoji === emoji ? { emoji, userIds } : reaction,
    )
    .filter((reaction) => reaction.userIds.length > 0);
}

function markRead(clubId: string) {
  void apiFetch<void>(`/clubs/${clubId}/read`, { method: 'POST' });
}

export function useClubChat(clubId: string) {
  const queryClient = useQueryClient();
  const { state } = useAuth();
  const me = state.status === 'signedIn' ? state.user : null;

  const history = useInfiniteQuery({
    queryKey: messagesKey(clubId),
    queryFn: ({ pageParam }) =>
      apiFetch<Page<ChatItem>>(
        `/clubs/${clubId}/messages` + (pageParam ? `?cursor=${pageParam}` : ''),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  useEffect(() => {
    const socket = getChatSocket();

    // A reconnected socket is in no rooms: join again, and refetch what
    // was sent while the connection was down
    function join() {
      socket.emit(CHAT_EVENTS.join, { clubId });
    }

    function onReconnect() {
      join();
      void queryClient.invalidateQueries({ queryKey: messagesKey(clubId) });
    }

    function onNew(message: ChatMessage) {
      if (message.clubId !== clubId) {
        return;
      }

      insertMessage(queryClient, clubId, message);
      // The chat is on screen: this message is read already
      markRead(clubId);
    }

    function onReactions(event: ReactionsEvent) {
      if (event.clubId === clubId) {
        setReactions(queryClient, clubId, event.messageId, event.reactions);
      }
    }

    function onDeleted(event: MessageDeletedEvent) {
      if (event.clubId !== clubId) {
        return;
      }

      removeMessage(queryClient, clubId, event.messageId);
      // Replies to it lose their quote: the server has already cleared it
      void queryClient.invalidateQueries({ queryKey: messagesKey(clubId) });
    }

    join();
    markRead(clubId);
    clearUnread(queryClient, clubId);
    setOpenChat(clubId);
    socket.io.on('reconnect', onReconnect);
    socket.on(CHAT_EVENTS.new, onNew);
    socket.on(CHAT_EVENTS.reactions, onReactions);
    socket.on(CHAT_EVENTS.deleted, onDeleted);

    return () => {
      setOpenChat(null);
      socket.emit(CHAT_EVENTS.leave, { clubId });
      socket.io.off('reconnect', onReconnect);
      socket.off(CHAT_EVENTS.new, onNew);
      socket.off(CHAT_EVENTS.reactions, onReactions);
      socket.off(CHAT_EVENTS.deleted, onDeleted);
      // Unread dots and "N a day" in the club list
      void queryClient.invalidateQueries({ queryKey: ['clubs'] });
    };
  }, [clubId, queryClient]);

  async function deliver(message: ChatItem) {
    let current = message;

    try {
      // Photo first: the message carries its public URL. Kept on the item,
      // so a retry after a socket failure doesn't upload it again.
      if (current.localPhotoUri && !current.photoUrl) {
        current = {
          ...current,
          photoUrl: await uploadChatPhoto(current.localPhotoUri),
        };
      }

      const ack: ChatAck<ChatMessage> = await getChatSocket()
        .timeout(SEND_TIMEOUT_MS)
        .emitWithAck(CHAT_EVENTS.send, {
          clubId,
          clientId: current.clientId,
          text: current.text,
          photoUrl: current.photoUrl ?? undefined,
          replyToId: current.replyTo?.id,
        });

      replaceMessage(
        queryClient,
        clubId,
        ack.ok ? ack.data : { ...current, status: 'failed' },
      );
    } catch {
      // Upload failed or no answer in time (offline, server down)
      replaceMessage(queryClient, clubId, { ...current, status: 'failed' });
    }
  }

  // Optimistic: the bubble appears at once, the server confirms it later
  function send({ text, localPhotoUri, replyTo }: ChatDraft) {
    if (!me) {
      return;
    }

    const clientId = randomUUID();
    const message: ChatItem = {
      id: clientId,
      clientId,
      clubId,
      text,
      photoUrl: null,
      localPhotoUri,
      replyTo: replyTo
        ? {
            id: replyTo.id,
            text: replyTo.text,
            hasPhoto: replyTo.photoUrl !== null,
            authorNickname: replyTo.author.nickname,
          }
        : null,
      reactions: [],
      createdAt: new Date().toISOString(),
      author: {
        id: me.id,
        nickname: me.nickname,
        displayName: me.displayName,
        avatarUrl: me.avatarUrl,
      },
      status: 'sending',
    };

    insertMessage(queryClient, clubId, message);
    void deliver(message);
  }

  // Same clientId: if the first attempt did reach the server, it isn't
  // stored twice
  function retry(message: ChatItem) {
    replaceMessage(queryClient, clubId, { ...message, status: 'sending' });
    void deliver(message);
  }

  // Optimistic too: shown at once, corrected by the server's answer
  async function react(message: ChatItem, emoji: ChatReaction) {
    // An unconfirmed message has no server id to react to yet
    if (!me || message.status) {
      return;
    }

    const previous = message.reactions;

    setReactions(
      queryClient,
      clubId,
      message.id,
      toggled(previous, emoji, me.id),
    );

    try {
      const ack: ChatAck<ReactionsEvent> = await getChatSocket()
        .timeout(SEND_TIMEOUT_MS)
        .emitWithAck(CHAT_EVENTS.react, { messageId: message.id, emoji });

      setReactions(
        queryClient,
        clubId,
        message.id,
        ack.ok ? ack.data.reactions : previous,
      );
    } catch {
      setReactions(queryClient, clubId, message.id, previous);
    }
  }

  // Gone at once on this phone; the others hear it from the server. A
  // refusal (or no answer) brings it back by reloading the history.
  async function deleteMessage(message: ChatItem) {
    removeMessage(queryClient, clubId, message.id);

    try {
      const ack: ChatAck = await getChatSocket()
        .timeout(SEND_TIMEOUT_MS)
        .emitWithAck(CHAT_EVENTS.delete, { messageId: message.id });

      if (!ack.ok) {
        void queryClient.invalidateQueries({ queryKey: messagesKey(clubId) });
      }
    } catch {
      void queryClient.invalidateQueries({ queryKey: messagesKey(clubId) });
    }
  }

  // Oldest first, the order the screen shows them in
  const messages = (history.data?.pages ?? [])
    .flatMap((page) => page.items)
    .reverse();

  return { history, messages, send, retry, react, deleteMessage };
}
