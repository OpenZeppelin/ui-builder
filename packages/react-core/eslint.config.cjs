// eslint.config.cjs for packages/react-core
const baseConfig = require('../../eslint.config.cjs');

module.exports = [
  ...baseConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Package-specific rules can go here if needed
    },
  },
  {
    ignores: ['dist/**/*', 'node_modules/**/*', '*.config.js', '*.config.cjs'],
  },
];
