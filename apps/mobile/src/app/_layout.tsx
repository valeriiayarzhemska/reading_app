import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { createQueryClient } from '@/api/query-client';

export default function RootLayout() {
  // useState, not a module constant: one client per app instance, never
  // recreated on re-render
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'My shelf' }} />
        <Stack.Screen name="search" options={{ title: 'Search' }} />
      </Stack>
    </QueryClientProvider>
  );
}
