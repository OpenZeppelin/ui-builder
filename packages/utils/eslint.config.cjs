// Import the base configuration
const baseConfig = require('../../eslint.config.cjs');

// For utils package, we want to specifically ensure dist is ignored
const utilsConfig = [
  ...baseConfig,
  {
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },
];

module.exports = utilsConfig;
