// Import the base configuration
const baseConfig = require('../../eslint.config.cjs');

// For types package, we want to specifically ensure dist is ignored
const typesConfig = [
  ...baseConfig,
  {
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },
];

module.exports = typesConfig;
