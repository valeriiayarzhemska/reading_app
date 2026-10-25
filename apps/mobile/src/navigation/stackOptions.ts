import type { ComponentProps } from 'react';

import type { Stack } from 'expo-router';

import { COLORS } from '@/theme/colors';

// The options object Stack.Screen takes (it also accepts a function form)
type StackScreenOptions = Exclude<
  NonNullable<ComponentProps<typeof Stack.Screen>['options']>,
  (...args: never[]) => unknown
>;

// Shared by the root stack and nested ones (a nested stack inherits nothing)
export const STACK_OPTIONS: StackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.backgroundTop },
  headerTintColor: COLORS.fg,
  headerTitleStyle: { fontFamily: 'Lora_500Medium' },
  headerShadowVisible: false,
  // Otherwise iOS shows the previous route's name, here "(tabs)"
  headerBackButtonDisplayMode: 'minimal',
  // Prevents a white flash during screen transitions
  contentStyle: { backgroundColor: COLORS.backgroundBottom },
};
