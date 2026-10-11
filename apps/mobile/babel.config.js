module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      // jsxImportSource: lets `className` work on React Native components
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
