import { vars } from 'nativewind';

// Names describe the role (fg, card, accent), not the hue: each theme gives
// every role its own value, and screens never name a hue
export interface Palette {
  backgroundTop: string;
  backgroundBottom: string;
  card: string;
  cardStrong: string;
  border: string;
  fg: string;
  fgMuted: string;
  fgFaint: string;
  accentLight: string;
  accent: string;
  accentDark: string;
  accentFg: string;
  // Accent-colored text: light on dark, deep on light (accentLight works
  // as a fill on both, but as text on a light background it fades)
  accentText: string;
  tabBar: string;
  sheet: string;
  backdrop: string;
  danger: string;
  success: string;
}

export const DARK: Palette = {
  backgroundTop: '#3A2A78',
  backgroundBottom: '#140E2E',
  card: 'rgba(255, 255, 255, 0.07)',
  cardStrong: 'rgba(255, 255, 255, 0.12)',
  border: 'rgba(255, 255, 255, 0.10)',
  fg: '#F4EFFF',
  fgMuted: '#B9AEDB',
  fgFaint: '#8F84B8',
  accentLight: '#F7CBA4',
  accent: '#F0A877',
  accentDark: '#E2834F',
  accentFg: '#2A1A12',
  accentText: '#F7CBA4',
  tabBar: 'rgba(30, 22, 69, 0.96)',
  sheet: '#241B55',
  backdrop: 'rgba(8, 5, 20, 0.6)',
  danger: '#FF8A8A',
  success: '#8EE0B0',
};

// Lavender paper: the same mood as the dark theme, ink instead of glass
export const LIGHT: Palette = {
  backgroundTop: '#F3EEFF',
  backgroundBottom: '#E6DEF8',
  card: 'rgba(43, 30, 102, 0.05)',
  cardStrong: 'rgba(43, 30, 102, 0.10)',
  border: 'rgba(43, 30, 102, 0.12)',
  fg: '#231A4A',
  fgMuted: '#5B5185',
  fgFaint: '#8A81AE',
  accentLight: '#F2B489',
  accent: '#E08A55',
  accentDark: '#C96A35',
  accentFg: '#2A1A12',
  accentText: '#B4572A',
  tabBar: 'rgba(255, 255, 255, 0.94)',
  sheet: '#FFFFFF',
  backdrop: 'rgba(25, 15, 60, 0.35)',
  danger: '#D14B4B',
  success: '#2E9E62',
};

// Translucent roles keep their alpha per theme, so they're passed whole;
// solid ones as "R G B" channels, so `bg-accent/20` still works
const TRANSLUCENT = new Set<keyof Palette>([
  'card',
  'cardStrong',
  'border',
  'tabBar',
  'backdrop',
]);

function channels(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);

  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

// The CSS variables tailwind.config.js points every color class at
export function paletteVars(palette: Palette) {
  const entries = (Object.keys(palette) as (keyof Palette)[]).map((role) => [
    `--${role}`,
    TRANSLUCENT.has(role) ? palette[role] : channels(palette[role]),
  ]);

  return vars(Object.fromEntries(entries));
}
