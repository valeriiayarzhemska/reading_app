import { endSession, getAccessToken, refreshAccessToken } from '@/auth/session';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface ApiFetchOptions extends RequestInit {
  // false for endpoints called before there is a session (sign-in)
  auth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  { auth = true, ...init }: ApiFetchOptions = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is not set — copy .env.example to .env',
    );
  }

  let res = await send(path, init, auth ? await getAccessToken() : null);

  // The access token expired early or was revoked: refresh once and retry
  if (res.status === 401 && auth) {
    const freshToken = await refreshAccessToken();

    if (freshToken) {
      res = await send(path, init, freshToken);
    }

    // Still rejected with a fresh token: the account is gone
    if (freshToken && res.status === 401) {
      await endSession();
    }
  }

  if (!res.ok) {
    // Nest error bodies look like { statusCode, message, error }
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? res.statusText);

    throw new ApiError(res.status, message);
  }

  // res.json() would throw on the empty body of a 204
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

function send(path: string, init: RequestInit, token: string | null) {
  return fetch(API_URL + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}
