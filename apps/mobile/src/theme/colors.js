// CommonJS so tailwind.config.js can require it.
// Names describe the role (fg, card, accent), not the hue: a redesign
// changes values here, not names across screens.
const COLORS = {
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

  tabBar: 'rgba(30, 22, 69, 0.96)',

  danger: '#FF8A8A',
  success: '#8EE0B0',
};

// Tailwind's nested shape, derived from COLORS — edit values above, not here.
// DEFAULT is the bare class (`bg-accent`), other keys add a suffix (`bg-accent-light`).
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
  'tab-bar': COLORS.tabBar,
  danger: COLORS.danger,
  success: COLORS.success,
};

module.exports = { COLORS, tailwindColors };
