import { useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { NOTIFICATION_EVENT } from '@reading/shared';

import { getChatSocket } from '@/chat/chatSocket';

// While signed in: a new notification refreshes the 🔔 badge (and the list,
// if it's loaded). The server pushes it to your personal socket room.
export function useNotificationEvents(isSignedIn: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const socket = getChatSocket();

    function onNotification() {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }

    socket.on(NOTIFICATION_EVENT, onNotification);

    return () => {
      socket.off(NOTIFICATION_EVENT, onNotification);
    };
  }, [isSignedIn, queryClient]);
}
