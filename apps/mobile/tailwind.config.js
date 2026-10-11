const { tailwindColors } = require('./src/theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tailwindColors,
      // Each weight is a separate font file in RN: `font-sans-bold`, not `font-bold`
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
