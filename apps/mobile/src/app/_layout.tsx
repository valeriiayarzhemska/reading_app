import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Lora_500Medium, Lora_600SemiBold } from '@expo-google-fonts/lora';
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';

import { ReportProvider } from '@/components/reports/ReportProvider';

import { createQueryClient } from '@/api/queryClient';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { useClubActivity } from '@/chat/useClubActivity';
import { useTimezoneSync } from '@/hooks/useTimezoneSync';
import { loadSavedLanguage } from '@/i18n';
import { stackOptions } from '@/navigation/stackOptions';
import { useNotificationEvents } from '@/notifications/useNotificationEvents';
import { ThemeProvider, useColors, useTheme } from '@/theme/ThemeProvider';
import { useLiveActivitySync } from '@/timer/useLiveActivitySync';
import { useReadingChecks } from '@/timer/useReadingChecks';
import { useSessionSync } from '@/timer/useSessionSync';
import { useTimerNotificationSync } from '@/timer/useTimerNotificationSync';

import '../../global.css';

// Hold the splash screen until fonts, the saved language and the session are
// loaded, so nothing flashes (system font, wrong language, sign-in screen)
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Lora_500Medium,
    Lora_600SemiBold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });
  // On a font error, start anyway with system fonts
  const isReady = isI18nReady && (fontsLoaded || fontError !== null);

  useEffect(() => {
    loadSavedLanguage().finally(() => setIsI18nReady(true));
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    // Gestures (sheet dragging) silently do nothing without this root view
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/* Above the sheet provider: sheets get the theme's variables too */}
          <ThemeProvider>
            <BottomSheetModalProvider>
              <ThemedStatusBar />

              {/* One Report sheet for every screen */}
              <ReportProvider>
                <RootNavigator />
              </ReportProvider>
            </BottomSheetModalProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

// Light text on the dark theme, dark text on the light one
function ThemedStatusBar() {
  const { scheme } = useTheme();

  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

function RootNavigator() {
  const { t } = useTranslation();
  const colors = useColors();
  const { state } = useAuth();
  const isSignedIn = state.status === 'signedIn';
  const isOnboarded = isSignedIn && state.user.onboardedAt !== null;

  useSessionSync(isSignedIn ? state.user.id : null);
  useClubActivity(isSignedIn);
  useNotificationEvents(isSignedIn);
  useReadingChecks(isSignedIn);
  useTimezoneSync();
  useLiveActivitySync();
  useTimerNotificationSync();

  useEffect(() => {
    if (state.status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [state.status]);

  if (state.status === 'loading') {
    return null;
  }

  return (
    <Stack screenOptions={stackOptions(colors)}>
      {/* When a guard flips, the router redirects to the first allowed screen */}
      <Stack.Protected guard={isOnboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen name="search" options={{ title: t('search.title') }} />

        <Stack.Screen name="add-book" options={{ title: t('addBook.title') }} />

        <Stack.Screen name="shelf/[status]" />

        {/* book/[id]: my shelf entry; books/[bookId]: the book, for anyone */}
        <Stack.Screen name="book/[id]" options={{ title: '' }} />

        <Stack.Screen name="books/[bookId]" options={{ title: '' }} />

        <Stack.Screen name="user/[nickname]" options={{ title: '' }} />

        <Stack.Screen name="follows/[nickname]" />

        <Stack.Screen name="collections/[id]" options={{ title: '' }} />

        <Stack.Screen name="posts/[id]" options={{ headerShown: false }} />

        <Stack.Screen
          name="notifications"
          options={{ title: t('notifications.title') }}
        />

        <Stack.Screen
          name="post-new"
          options={{ presentation: 'modal', title: t('posts.new') }}
        />

        {/* The chat and About the room draw their own headers */}
        <Stack.Screen name="clubs/[id]" options={{ headerShown: false }} />

        <Stack.Screen name="club-info/[id]" options={{ headerShown: false }} />

        <Stack.Screen
          name="club-book/[id]"
          options={{ title: t('clubs.readingTogether') }}
        />

        {/* A modal with its own stack inside: form → book picker */}
        <Stack.Screen
          name="collection-editor/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />

        <Stack.Screen
          name="favorites"
          options={{ title: t('profile.favorites.title') }}
        />

        <Stack.Screen
          name="settings"
          options={{ title: t('settings.title') }}
        />

        {/* Slides up over everything; swiping down minimizes it */}
        <Stack.Screen
          name="timer"
          options={{ presentation: 'modal', headerShown: false }}
        />

        <Stack.Screen
          name="edit-profile"
          options={{ title: t('editProfile.title') }}
        />

        <Stack.Screen name="design" options={{ title: 'Design system' }} />
      </Stack.Protected>

      <Stack.Protected guard={isSignedIn && !isOnboarded}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
