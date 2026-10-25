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
  type Page,
} from '@reading/shared';

import { apiFetch } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { getChatSocket } from '@/chat/chatSocket';

const SEND_TIMEOUT_MS = 10_000;

// Saved messages have no status; the sender's own bubble has one until the
// server confirms it
export interface ChatItem extends ChatMessage {
  status?: 'sending' | 'failed';
}

type ChatPages = InfiniteData<Page<ChatItem>, string | null>;

export const messagesKey = (clubId: string) => ['messages', clubId] as const;

// Every cache write goes through here. Pages are newest first, so the newest
// message is the first item of the first page.
function updateItems(
  queryClient: QueryClient,
  clubId: string,
  update: (newest: ChatItem[]) => ChatItem[],
) {
  queryClient.setQueryData<ChatPages>(messagesKey(clubId), (data) => {
    if (!data) {
      return data;
    }

    const [first, ...rest] = data.pages;

    return {
      ...data,
      pages: [{ ...first, items: update(first.items) }, ...rest],
    };
  });
}

// Adds a message unless it's already there (matched by clientId: the
// optimistic bubble and the saved message share it)
function insertMessage(
  queryClient: QueryClient,
  clubId: string,
  message: ChatItem,
) {
  updateItems(queryClient, clubId, (items) =>
    items.some((item) => item.clientId === message.clientId)
      ? items
      : [message, ...items],
  );
}

function replaceMessage(
  queryClient: QueryClient,
  clubId: string,
  next: ChatItem,
) {
  updateItems(queryClient, clubId, (items) =>
    items.map((item) => (item.clientId === next.clientId ? next : item)),
  );
}

function markRead(clubId: string) {
  void apiFetch<void>(`/clubs/${clubId}/read`, { method: 'POST' });
}

export function useClubChat(clubId: string) {
  const queryClient = useQueryClient();
  const { state } = useAuth();

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

    join();
    markRead(clubId);
    socket.io.on('reconnect', onReconnect);
    socket.on(CHAT_EVENTS.new, onNew);

    return () => {
      socket.emit(CHAT_EVENTS.leave, { clubId });
      socket.io.off('reconnect', onReconnect);
      socket.off(CHAT_EVENTS.new, onNew);
      // Unread dots and "N a day" in the club list
      void queryClient.invalidateQueries({ queryKey: ['clubs'] });
    };
  }, [clubId, queryClient]);

  async function deliver(message: ChatItem) {
    try {
      const ack: ChatAck<ChatMessage> = await getChatSocket()
        .timeout(SEND_TIMEOUT_MS)
        .emitWithAck(CHAT_EVENTS.send, {
          clubId,
          clientId: message.clientId,
          text: message.text,
        });

      replaceMessage(
        queryClient,
        clubId,
        ack.ok ? ack.data : { ...message, status: 'failed' },
      );
    } catch {
      // No answer in time (offline, server down)
      replaceMessage(queryClient, clubId, { ...message, status: 'failed' });
    }
  }

  // Optimistic: the bubble appears at once, the server confirms it later
  function send(text: string) {
    if (state.status !== 'signedIn') {
      return;
    }

    const { id, nickname, displayName, avatarUrl } = state.user;
    const clientId = randomUUID();
    const message: ChatItem = {
      id: clientId,
      clientId,
      clubId,
      text,
      createdAt: new Date().toISOString(),
      author: { id, nickname, displayName, avatarUrl },
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

  // Oldest first, the order the screen shows them in
  const messages = (history.data?.pages ?? [])
    .flatMap((page) => page.items)
    .reverse();

  return { history, messages, send, retry };
}
