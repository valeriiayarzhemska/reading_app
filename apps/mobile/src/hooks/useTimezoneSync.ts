import { useEffect } from 'react';
import { AppState } from 'react-native';

import { getCalendars } from 'expo-localization';

import { updateProfile } from '@/api/users';
import { useAuth } from '@/auth/AuthContext';

// The server cuts calendar days in the user's timezone, so it must match the
// phone. Checked on start and on every return to the app (travel); a request
// is sent only when the zone actually changed.
export function useTimezoneSync() {
  const { state, updateUser } = useAuth();
  const savedTimezone =
    state.status === 'signedIn' ? state.user.timezone : null;

  useEffect(() => {
    if (!savedTimezone) {
      return;
    }

    const sync = () => {
      const deviceTimezone = getCalendars()[0]?.timeZone;

      if (deviceTimezone && deviceTimezone !== savedTimezone) {
        // Offline or failed: harmless, the next check tries again
        updateProfile({ timezone: deviceTimezone })
          .then(updateUser)
          .catch(() => {});
      }
    };

    sync();

    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') {
        sync();
      }
    });

    return () => subscription.remove();
  }, [savedTimezone, updateUser]);
}
