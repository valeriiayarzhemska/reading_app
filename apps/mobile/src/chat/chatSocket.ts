import { io, type Socket } from 'socket.io-client';

import { CHAT_NAMESPACE } from '@reading/shared';

import { getAccessToken, onSessionEnd } from '@/auth/session';

let socket: Socket | null = null;

// One connection for the whole app, opened on first use. Chat screens join
// and leave rooms on it; they don't open sockets of their own.
export function getChatSocket(): Socket {
  socket ??= io(`${process.env.EXPO_PUBLIC_API_URL}${CHAT_NAMESPACE}`, {
    // Skip the HTTP long-polling start: native apps can go straight to WS
    transports: ['websocket'],
    // A function, not a value: it runs on every (re)connect, so a reconnect
    // an hour later sends a fresh token instead of the expired first one
    auth: (callback) => {
      void getAccessToken().then((token) => callback({ token }));
    },
  });

  return socket;
}

// Signing out closes the connection; the next user gets a new one
onSessionEnd(() => {
  socket?.disconnect();
  socket = null;
});
