// Design tokens: the single source of truth for colors.
// CommonJS so tailwind.config.js (Node) can require it; app code imports it
// too, for things classes can't do (gradients, navigation header colors).
// Names describe the ROLE (fg, card, accent), not the hue — so a redesign
// changes values here, not names across every screen.

// Use in code: import { COLORS } from '@/theme/colors' → COLORS.accent
const COLORS = {
  // Screen background: a vertical gradient, lighter violet at the top
  backgroundTop: '#3A2A78',
  backgroundBottom: '#140E2E',

  // Translucent "glass" cards on top of the background
  card: 'rgba(255, 255, 255, 0.07)',
  cardStrong: 'rgba(255, 255, 255, 0.12)',
  border: 'rgba(255, 255, 255, 0.10)',

  // Text and icons ("foreground")
  fg: '#F4EFFF',
  fgMuted: '#B9AEDB',
  fgFaint: '#8F84B8',

  // Peach → orange: primary buttons, active tab, highlights
  accentLight: '#F7CBA4',
  accent: '#F0A877',
  accentDark: '#E2834F',
  accentFg: '#2A1A12', // text on top of the accent

  danger: '#FF8A8A',
  success: '#8EE0B0',
};

// The same colors in Tailwind's nested shape, derived from COLORS (never
// edit values here). DEFAULT gives the bare class: `bg-accent`, and the other
// keys give `bg-accent-light`, `text-fg-muted`...
const tailwindColors = {
  background: {
    top: COLORS.backgroundTop,
    bottom: COLORS.backgroundBottom,
  },
  card: {
    DEFAULT: COLORS.card,
    strong: COLORS.cardStrong,
  },
  border: COLORS.border,
  fg: {
    DEFAULT: COLORS.fg,
    muted: COLORS.fgMuted,
    faint: COLORS.fgFaint,
  },
  accent: {
    light: COLORS.accentLight,
    DEFAULT: COLORS.accent,
    dark: COLORS.accentDark,
    fg: COLORS.accentFg,
  },
  danger: COLORS.danger,
  success: COLORS.success,
};

module.exports = { COLORS, tailwindColors };
