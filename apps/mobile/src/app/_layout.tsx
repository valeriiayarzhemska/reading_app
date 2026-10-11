import '../../global.css';

import { Lora_500Medium, Lora_600SemiBold } from '@expo-google-fonts/lora';
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { createQueryClient } from '@/api/query-client';
import { COLORS } from '@/theme/colors';

// Hold the splash screen until fonts load, so text never flashes in the system font
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const [fontsLoaded, fontError] = useFonts({
    Lora_500Medium,
    Lora_600SemiBold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });
  // On a font error, start anyway with system fonts
  const isReady = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
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
        <Stack.Screen name="search" options={{ title: 'Search' }} />
        <Stack.Screen name="design" options={{ title: 'Design system' }} />
      </Stack>
    </QueryClientProvider>
  );
}
