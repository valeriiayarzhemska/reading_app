import type { NicknameError } from './profile.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  // ISO date: lets the app refresh shortly before expiry instead of waiting for a 401
  accessTokenExpiresAt: string;
}

export interface Me {
  id: string;
  email: string | null;
  nickname: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  links: string[];
  timezone: string;
  // null until the user has picked their name and nickname
  onboardedAt: string | null;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: Me;
}

export interface NicknameAvailability {
  available: boolean;
  // Set when the nickname breaks the format rules (then available is false)
  error: NicknameError | null;
}
