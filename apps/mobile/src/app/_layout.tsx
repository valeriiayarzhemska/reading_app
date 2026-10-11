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
import { loadSavedLanguage } from '@/i18n';
import { COLORS } from '@/theme/colors';

// Hold the splash screen until fonts and the saved language are loaded, so
// text never flashes in the system font or in the wrong language
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { t } = useTranslation();
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

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    // Gestures (sheet dragging) silently do nothing without this root view
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <StatusBar style="light" />

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
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            <Stack.Screen
              name="search"
              options={{ title: t('search.title') }}
            />

            <Stack.Screen name="design" options={{ title: 'Design system' }} />
          </Stack>
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
