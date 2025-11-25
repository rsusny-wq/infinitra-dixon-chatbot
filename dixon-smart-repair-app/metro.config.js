const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for Expo SDK 53 import.meta issue
// Disable package.json exports to prevent import.meta errors with zustand and other packages
config.resolver.unstable_enablePackageExports = false;

// Add support for web platform
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add resolver for web-specific modules
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native$': 'react-native-web',
};

// Ensure proper module resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx'];

// Transform configuration
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
