import type { AuthResponse, Me } from '@reading/shared';
import { apiFetch } from './client';

export function devLogin(userId: string) {
  return apiFetch<AuthResponse>('/auth/dev-login', {
    method: 'POST',
    body: JSON.stringify({ userId }),
    auth: false,
  });
}

export function fetchMe() {
  return apiFetch<Me>('/auth/me');
}

export function logout(refreshToken: string) {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    auth: false,
  });
}
