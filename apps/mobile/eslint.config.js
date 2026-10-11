// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      // Every if/else/for body in braces, same as the API (oxlint `curly`)
      curly: ['error', 'all'],
    },
  },
  {
    ignores: ['dist/*', '.expo/*'],
  },
]);
