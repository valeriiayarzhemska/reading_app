import { useEffect } from 'react';

import { useQueryClient, type QueryClient } from '@tanstack/react-query';

import {
  CHAT_EVENTS,
  type ClubActivityEvent,
  type ClubSummary,
} from '@reading/shared';

import { getChatSocket } from '@/chat/chatSocket';

// The club whose chat is on screen: its new messages are read as they come
let openChatClubId: string | null = null;

export function setOpenChat(clubId: string | null) {
  openChatClubId = clubId;
}

// Applies a change to one club in both lists (My and every searched All)
function updateClub(
  queryClient: QueryClient,
  clubId: string,
  update: (club: ClubSummary) => ClubSummary,
) {
  for (const queryKey of [
    ['clubs', 'mine'],
    ['clubs', 'all'],
  ]) {
    queryClient.setQueriesData<ClubSummary[]>({ queryKey }, (clubs) =>
      clubs?.map((club) => (club.id === clubId ? update(club) : club)),
    );
  }
}

// Opening a chat reads it: the dot goes at once, not after the next refetch
export function clearUnread(queryClient: QueryClient, clubId: string) {
  updateClub(queryClient, clubId, (club) => ({ ...club, unreadCount: 0 }));
}

// Keeps the club lists live while signed in: a message in any of your clubs
// adds to its "N a day" and, unless that chat is open, to its unread dot.
// The cache is updated in place; no request per message.
export function useClubActivity(isSignedIn: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const socket = getChatSocket();

    function onActivity({ clubId }: ClubActivityEvent) {
      const isOpen = clubId === openChatClubId;

      updateClub(queryClient, clubId, (club) => ({
        ...club,
        messagesToday: club.messagesToday + 1,
        unreadCount: club.unreadCount + (isOpen ? 0 : 1),
      }));
    }

    socket.on(CHAT_EVENTS.activity, onActivity);

    return () => {
      socket.off(CHAT_EVENTS.activity, onActivity);
    };
  }, [isSignedIn, queryClient]);
}
