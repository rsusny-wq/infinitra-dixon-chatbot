const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web-specific configuration
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Web-specific resolver configuration to handle problematic modules
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native$': 'react-native-web',
};

// Configure Metro to handle import.meta properly
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
