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

// Keep the splash screen up until fonts are ready — otherwise text would
// flash in the system font first ("flash of unstyled text")
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // useState, not a module constant: one client per app instance, never
  // recreated on re-render
  const [queryClient] = useState(createQueryClient);
  const [fontsLoaded, fontError] = useFonts({
    Lora_500Medium,
    Lora_600SemiBold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });
  // On a font error we still start the app — with system fonts
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
          // Behind every screen: no white flash during transitions
          contentStyle: { backgroundColor: COLORS.backgroundBottom },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'My shelf' }} />
        <Stack.Screen name="search" options={{ title: 'Search' }} />
      </Stack>
    </QueryClientProvider>
  );
}
