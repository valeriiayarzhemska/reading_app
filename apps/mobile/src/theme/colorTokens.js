// CommonJS so tailwind.config.js can require it. Every color class points at
// a CSS variable that ThemeProvider fills from the current palette
// (palettes.ts): one class, a value per theme. Solid colors are "R G B"
// channels so opacity modifiers work (bg-accent/20); translucent ones
// (cards, borders) carry their own alpha.
const solid = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const whole = (name) => `var(--${name})`;

// DEFAULT is the bare class (`bg-accent`), other keys add a suffix (`bg-accent-light`)
const tailwindColors = {
  background: {
    top: solid('backgroundTop'),
    bottom: solid('backgroundBottom'),
  },
  card: {
    DEFAULT: whole('card'),
    strong: whole('cardStrong'),
  },
  border: whole('border'),
  fg: {
    DEFAULT: solid('fg'),
    muted: solid('fgMuted'),
    faint: solid('fgFaint'),
  },
  accent: {
    light: solid('accentLight'),
    DEFAULT: solid('accent'),
    dark: solid('accentDark'),
    fg: solid('accentFg'),
    text: solid('accentText'),
  },
  'tab-bar': whole('tabBar'),
  sheet: solid('sheet'),
  danger: solid('danger'),
  success: solid('success'),
};

module.exports = { tailwindColors };
