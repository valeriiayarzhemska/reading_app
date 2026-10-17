import type { NewReadingSession } from '@reading/shared';
import { useMMKVString } from 'react-native-mmkv';
import { timerStorage } from './storage';

export const PENDING_KEY = 'pendingSessions';

// A finished session the server hasn't confirmed yet. userId: after a sign
// out, another account must not send (or see) these.
export interface PendingSession {
  userId: string;
  session: NewReadingSession;
}

export function readPending(): PendingSession[] {
  const raw = timerStorage.getString(PENDING_KEY);

  return raw ? (JSON.parse(raw) as PendingSession[]) : [];
}

function writePending(items: PendingSession[]) {
  // Removing the key when empty lets hooks tell "nothing waiting" cheaply
  if (items.length === 0) {
    timerStorage.remove(PENDING_KEY);
  } else {
    timerStorage.set(PENDING_KEY, JSON.stringify(items));
  }
}

export function addPending(item: PendingSession) {
  const others = readPending().filter(
    (pending) => pending.session.clientId !== item.session.clientId,
  );

  writePending([...others, item]);
}

export function removePending(clientId: string) {
  writePending(
    readPending().filter((pending) => pending.session.clientId !== clientId),
  );
}

// Re-renders when the queue changes (useMMKVString listens to the key)
export function usePendingCount(userId: string | null): number {
  const [raw] = useMMKVString(PENDING_KEY, timerStorage);

  if (!raw || !userId) {
    return 0;
  }

  const items = JSON.parse(raw) as PendingSession[];

  return items.filter((item) => item.userId === userId).length;
}
