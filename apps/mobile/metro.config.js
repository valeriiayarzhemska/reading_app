const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// getDefaultConfig also detects the pnpm monorepo (packages/shared etc.)
const config = getDefaultConfig(__dirname);

// Compiles global.css + the Tailwind classes used in src/ into native styles
module.exports = withNativeWind(config, { input: './global.css' });
