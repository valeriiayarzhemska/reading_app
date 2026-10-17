import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';
import { syncPendingSessions } from '@/api/sessions';
import { PENDING_KEY } from './pending-sessions';
import { timerStorage } from './storage';

const RETRY_INTERVAL_MS = 60_000;

// Mounted once for the signed-in user. Sends queued sessions right away,
// whenever the app comes back to the foreground, and every minute while
// something is waiting.
export function useSessionSync(userId: string | null) {
  const queryClient = useQueryClient();
  const [pending] = useMMKVString(PENDING_KEY, timerStorage);
  const hasPending = pending !== undefined;

  useEffect(() => {
    if (!userId || !hasPending) {
      return;
    }

    const sync = () => {
      void syncPendingSessions(queryClient, userId);
    };

    sync();

    const interval = setInterval(sync, RETRY_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sync();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [userId, hasPending, queryClient]);
}
