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
  timezone: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: Me;
}
