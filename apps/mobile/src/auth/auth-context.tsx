import type { AuthResponse, Me } from '@reading/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { devLogin, fetchMe, logout } from '@/api/auth';
import {
  currentRefreshToken,
  endSession,
  loadSession,
  onSessionEnd,
  startSession,
} from './session';

type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: Me };

interface AuthContextValue {
  state: AuthState;
  signInDev: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    // Covers every way a session ends: sign-out, failed refresh, deleted account.
    // Clearing the cache stops the next user from seeing this user's data.
    const unsubscribe = onSessionEnd(() => {
      queryClient.clear();
      setState({ status: 'signedOut' });
    });

    restoreSession().then(setState);

    return unsubscribe;
  }, [queryClient]);

  const completeSignIn = useCallback(async (response: AuthResponse) => {
    await startSession(response.tokens);
    setState({ status: 'signedIn', user: response.user });
  }, []);

  const signInDev = useCallback(
    async (userId: string) => completeSignIn(await devLogin(userId)),
    [completeSignIn],
  );

  const signOut = useCallback(async () => {
    const refreshToken = currentRefreshToken();

    // Best effort: sign out locally even if the server can't be reached
    if (refreshToken) {
      await logout(refreshToken).catch(() => undefined);
    }

    await endSession();
  }, []);

  const value = useMemo(
    () => ({ state, signInDev, signOut }),
    [state, signInDev, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function restoreSession(): Promise<AuthState> {
  const hasTokens = await loadSession();

  if (!hasTokens) {
    return { status: 'signedOut' };
  }

  try {
    return { status: 'signedIn', user: await fetchMe() };
  } catch {
    // A rejected refresh already ended the session; anything else (offline)
    // also lands on sign-in for now
    return { status: 'signedOut' };
  }
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }

  return value;
}
