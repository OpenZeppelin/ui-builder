// Import the base configuration from the root and shared utils
const baseConfig = require('../../eslint.config.cjs');

// Import only the plugins we need for overrides
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const unusedImportsPlugin = require('eslint-plugin-unused-imports');

// Only add package-specific overrides
module.exports = [
  ...baseConfig,

  // Builder-specific TypeScript configuration with project reference
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
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
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
      // Prevent importing adapter packages directly in builder; use ecosystemManager dynamic loading
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@openzeppelin/contracts-ui-builder-adapter-*'],
              message:
                'Do not import adapter packages directly in the builder. Use dynamic loading via src/core/ecosystemManager.ts.',
            },
          ],
        },
      ],
    },
  },

  // Allowlist files that are explicitly responsible for dynamic adapter integration or typed config
  {
    files: [
      'src/core/ecosystemManager.ts',
      // This config is intentionally typed for EVM and is loaded by the EVM adapter at runtime
      'src/config/wallet/rainbowkit.config.ts',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];
