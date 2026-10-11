const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// getDefaultConfig also detects the pnpm monorepo (packages/shared etc.)
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
