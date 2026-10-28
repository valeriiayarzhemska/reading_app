import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';

import { settingsStorage } from '@/settings/readingSettings';
import { DARK, LIGHT, paletteVars, type Palette } from './palettes';

export type ThemePreference = 'system' | 'light' | 'dark';
export type Scheme = 'light' | 'dark';

interface Theme {
  scheme: Scheme;
  colors: Palette;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<Theme | null>(null);

function isPreference(value: string | undefined): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

// Two channels for one palette: CSS variables on the root View for
// NativeWind classes (text-fg, bg-card), and context for colors set in code
// (icons, gradients). Both follow the same scheme.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [saved, setSaved] = useMMKVString('theme', settingsStorage);
  const preference = isPreference(saved) ? saved : 'system';
  const scheme: Scheme =
    preference === 'system'
      ? systemScheme === 'light'
        ? 'light'
        : 'dark'
      : preference;
  const colors = scheme === 'light' ? LIGHT : DARK;

  return (
    <ThemeContext.Provider
      value={{ scheme, colors, preference, setPreference: setSaved }}
    >
      <View style={[{ flex: 1 }, paletteVars(colors)]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return theme;
}

// Colors for code (icons, gradients). A component reading it re-renders
// when the theme changes.
export function useColors(): Palette {
  return useTheme().colors;
}
