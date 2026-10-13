import type { ConfigContext, ExpoConfig } from 'expo/config';

// Extends app.json with values from .env (Expo loads .env before this file).
// "123-abc.apps.googleusercontent.com" → "com.googleusercontent.apps.123-abc"
function googleIosUrlScheme(iosClientId: string): string {
  return iosClientId.split('.').reverse().join('.');
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  return {
    ...config,
    name: config.name ?? 'Reading App',
    slug: config.slug ?? 'reading-app',
    plugins: [
      ...(config.plugins ?? []),
      'expo-dev-client',
      ...(iosClientId
        ? [
            [
              '@react-native-google-signin/google-signin',
              { iosUrlScheme: googleIosUrlScheme(iosClientId) },
            ] as [string, Record<string, string>],
          ]
        : []),
    ],
  };
};
