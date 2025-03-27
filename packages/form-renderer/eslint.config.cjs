// Import the base configuration from the root
const baseConfig = require('../../eslint.config.cjs');

// Import only the plugins we need for overrides
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const unusedImportsPlugin = require('eslint-plugin-unused-imports');

// Only add package-specific overrides
module.exports = [
  ...baseConfig,

  // Form-renderer specific TypeScript configuration with project reference
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off', // Explicitly disable in favor of unused-imports
      '@typescript-eslint/explicit-module-boundary-types': ['warn'],
      '@typescript-eslint/explicit-function-return-type': ['warn'],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Relax rules for story files
  {
    files: ['src/stories/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
