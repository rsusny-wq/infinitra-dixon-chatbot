module.exports = function (api) {
  api.cache(true);
  
  const presets = ['babel-preset-expo'];
  const plugins = [];

  // Add import.meta transformation for web platform
  if (process.env.EXPO_PLATFORM === 'web') {
    plugins.push([
      'babel-plugin-transform-import-meta',
      {
        module: 'ES6'
      }
    ]);
  }

  return {
    presets,
    plugins,
  };
};
