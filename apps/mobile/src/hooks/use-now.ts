import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// Re-renders every second with the current time. Missed ticks don't matter
// (the timer is calculated from timestamps); this only redraws it.
export function useNow(enabled: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const id = setInterval(() => setNow(Date.now()), intervalMs);
    // Intervals don't run in the background: catch up as soon as the app
    // is opened again, instead of showing the old time for a second
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNow(Date.now());
      }
    });

    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, [enabled, intervalMs]);

  return now;
}
