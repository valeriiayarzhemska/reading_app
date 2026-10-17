import '../../global.css';

import { Lora_500Medium, Lora_600SemiBold } from '@expo-google-fonts/lora';
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createQueryClient } from '@/api/query-client';
import { AuthProvider, useAuth } from '@/auth/auth-context';
import { loadSavedLanguage } from '@/i18n';
import { COLORS } from '@/theme/colors';
import { useSessionSync } from '@/timer/use-session-sync';

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
          <BottomSheetModalProvider>
            <StatusBar style="light" />

            <RootNavigator />
          </BottomSheetModalProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { t } = useTranslation();
  const { state } = useAuth();
  const isSignedIn = state.status === 'signedIn';
  const isOnboarded = isSignedIn && state.user.onboardedAt !== null;

  useSessionSync(isSignedIn ? state.user.id : null);

  useEffect(() => {
    if (state.status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [state.status]);

  if (state.status === 'loading') {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.backgroundTop },
        headerTintColor: COLORS.fg,
        headerTitleStyle: { fontFamily: 'Lora_500Medium' },
        headerShadowVisible: false,
        // Otherwise iOS shows the previous route's name, here "(tabs)"
        headerBackButtonDisplayMode: 'minimal',
        // Prevents a white flash during screen transitions
        contentStyle: { backgroundColor: COLORS.backgroundBottom },
      }}
    >
      {/* When a guard flips, the router redirects to the first allowed screen */}
      <Stack.Protected guard={isOnboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen name="search" options={{ title: t('search.title') }} />

        <Stack.Screen name="add-book" options={{ title: t('addBook.title') }} />

        <Stack.Screen name="shelf/[status]" />

        <Stack.Screen name="book/[id]" options={{ title: '' }} />

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
