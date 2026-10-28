import type { ComponentProps } from 'react';

import type { Stack } from 'expo-router';

import type { Palette } from '@/theme/palettes';

// The options object Stack.Screen takes (it also accepts a function form)
type StackScreenOptions = Exclude<
  NonNullable<ComponentProps<typeof Stack.Screen>['options']>,
  (...args: never[]) => unknown
>;

// Shared by the root stack and nested ones (a nested stack inherits
// nothing). A function of the palette: headers follow the theme.
export function stackOptions(colors: Palette): StackScreenOptions {
  return {
    headerStyle: { backgroundColor: colors.backgroundTop },
    headerTintColor: colors.fg,
    headerTitleStyle: { fontFamily: 'Lora_500Medium' },
    headerShadowVisible: false,
    // Otherwise iOS shows the previous route's name, here "(tabs)"
    headerBackButtonDisplayMode: 'minimal',
    // Prevents a white flash during screen transitions
    contentStyle: { backgroundColor: colors.backgroundBottom },
  };
}
