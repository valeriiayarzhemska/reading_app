import type { AuthResponse, AuthTokens } from '@reading/shared';

import { deleteTokens, readTokens, writeTokens } from './tokenStorage';

// Token handling lives outside React because apiFetch (also outside React)
// needs it on every request.

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const REFRESH_MARGIN_MS = 60_000;

let tokens: AuthTokens | null = null;
let refreshInFlight: Promise<string | null> | null = null;
const endListeners = new Set<() => void>();

export async function loadSession(): Promise<boolean> {
  tokens = await readTokens();

  return tokens !== null;
}

export async function startSession(next: AuthTokens): Promise<void> {
  tokens = next;
  await writeTokens(next);
}

export async function endSession(): Promise<void> {
  tokens = null;
  await deleteTokens();
  endListeners.forEach((listener) => listener());
}

export function onSessionEnd(listener: () => void): () => void {
  endListeners.add(listener);

  return () => endListeners.delete(listener);
}

export function currentRefreshToken(): string | null {
  return tokens?.refreshToken ?? null;
}

// Refreshes shortly before expiry, so most requests never see a 401
export async function getAccessToken(): Promise<string | null> {
  if (!tokens) {
    return null;
  }

  const expiresAt = new Date(tokens.accessTokenExpiresAt).getTime();

  if (expiresAt - Date.now() > REFRESH_MARGIN_MS) {
    return tokens.accessToken;
  }

  return refreshAccessToken();
}

// Single-flight: concurrent callers share one request. With rotation, two
// parallel refreshes would invalidate each other and log the user out.
export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

async function doRefresh(): Promise<string | null> {
  const refreshToken = tokens?.refreshToken;

  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await endSession();

      return null;
    }

    const { tokens: next } = (await res.json()) as AuthResponse;

    await startSession(next);

    return next.accessToken;
  } catch {
    // Offline: keep the session, the next request will try again
    return null;
  }
}
