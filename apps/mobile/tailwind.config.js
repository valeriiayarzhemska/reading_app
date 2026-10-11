const { tailwindColors } = require('./src/theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind scans these files for class names and generates only those
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tailwindColors,
      // In React Native each weight is a separate font file, so each weight
      // gets its own family: `font-sans-bold`, not `font-sans font-bold`.
      fontFamily: {
        serif: ['Lora_500Medium'],
        'serif-semibold': ['Lora_600SemiBold'],
        sans: ['NunitoSans_400Regular'],
        'sans-semibold': ['NunitoSans_600SemiBold'],
        'sans-bold': ['NunitoSans_700Bold'],
      },
      borderRadius: {
        card: '22px',
      },
    },
  },
  plugins: [],
};
