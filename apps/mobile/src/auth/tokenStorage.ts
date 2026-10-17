import * as SecureStore from 'expo-secure-store';

import type { AuthTokens } from '@reading/shared';

// iOS Keychain / Android Keystore: encrypted by the OS, unlike AsyncStorage
const KEY = 'auth-tokens';

export async function readTokens(): Promise<AuthTokens | null> {
  const raw = await SecureStore.getItemAsync(KEY).catch(() => null);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

export async function writeTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(tokens));
}

export async function deleteTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
