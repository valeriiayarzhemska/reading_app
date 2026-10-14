import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// webClientId makes Google issue the ID token *for our backend* (its audience),
// which is what the API checks
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

// Returns null when the user closes Google's sheet: that's not an error
export async function getGoogleIdToken(): Promise<string | null> {
  // Android only (needs Google Play Services); resolves immediately on iOS
  await GoogleSignin.hasPlayServices();

  try {
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return null;
    }

    if (!response.data.idToken) {
      throw new Error('Google returned no ID token');
    }

    return response.data.idToken;
  } catch (error) {
    // A second tap while the sheet is already open
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) {
      return null;
    }

    throw error;
  }
}

// Otherwise the next sign-in silently reuses this Google account
export async function signOutOfGoogle(): Promise<void> {
  await GoogleSignin.signOut().catch(() => undefined);
}
