// portions of this code were generated with chatGPT as an AI assistant

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      'module:metro-react-native-babel-preset', 
      'babel-preset-expo',
      '@babel/preset-react',
      '@babel/preset-typescript'
    ],
    plugins: [
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],
      'react-native-reanimated/plugin'
    ],
  };
};

