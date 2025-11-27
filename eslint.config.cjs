// Import shared utilities
const { getPluginConfigs } = require('./.eslint/utils.cjs');

// Import plugins
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const reactRefreshPlugin = require('eslint-plugin-react-refresh');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const unusedImportsPlugin = require('eslint-plugin-unused-imports');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const jsdocPlugin = require('eslint-plugin-jsdoc');

// Extract rules from recommended configs
const typescriptRecommendedRules = getPluginConfigs(typescriptPlugin, 'recommended');
const reactRecommendedRulesRaw = getPluginConfigs(reactPlugin, 'recommended');
// Remove jsx-uses-react from recommended rules - it marks React as used even when disabled
const reactRecommendedRules = { ...reactRecommendedRulesRaw };
delete reactRecommendedRules['react/jsx-uses-react'];
const reactHooksRecommendedRules = getPluginConfigs(reactHooksPlugin, 'recommended');

// Detect if we're in a package context by checking for custom adapter plugin
let customPlugin = null;
try {
  // Only attempt to load custom plugin if not already defined
  if (!global.__HAS_LOADED_CUSTOM_PLUGIN) {
    customPlugin = require('./.eslint/index.cjs');
    global.__HAS_LOADED_CUSTOM_PLUGIN = true;
  }
} catch (e) {
  // This is fine - we're probably running ESLint in a package subdirectory
  customPlugin = null;
}

// Base configuration that can be extended by all packages
const baseConfig = [
  // Ignore patterns for all files
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.d.ts',
      '**/*.min.js',
      'coverage/**',
      '**/.DS_Store',
      '**/*.svg',
      '**/*.json',
      '**/*.html',
      '**/*.css',
      '**/*.md',
      '**/tsconfig.tsbuildinfo',
      '**/dist/',
      'packages/builder/test-results/',
      '*.snap',
      '*.lock',
      '*.log',
      'badges/',
      'public/',
      '.husky/_/',
      'exports/',
    ],
  },

  // Global settings
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        document: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
        console: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },

  // JavaScript files configuration
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },

  // Base TypeScript configuration - without project references
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...typescriptRecommendedRules,
      '@typescript-eslint/no-unused-vars': 'off', // Explicitly disable in favor of unused-imports
      // Disable rules that require type checking as they will be enabled in the strict config
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },

  // React configuration
  {
    files: ['**/*.jsx', '**/*.tsx'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      ...reactRecommendedRules,
      ...reactHooksRecommendedRules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Import and sorting rules
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImportsPlugin,
      react: reactPlugin,
    },
    rules: {
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      // Disallow direct console usage; use logger utility instead
      'no-console': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Test files override: allow console usage in tests
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/*.test.jsx'],
    rules: {
      'no-console': 'off',
    },
  },

  // Story files override: allow console usage in Storybook stories
  {
    files: ['**/*.stories.tsx', '**/*.stories.jsx', '**/*.stories.ts', '**/*.stories.js'],
    rules: {
      'no-console': 'off',
    },
  },

  // Adapter Stellar scripts override: allow console usage in Node scripts
  {
    files: ['packages/adapter-stellar/scripts/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },

  // Adapter Stellar validator override: allow console in the type coverage validator
  {
    files: ['packages/adapter-stellar/src/mapping/type-coverage-validator.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // JSDoc rules for libraries
  {
    files: ['packages/renderer/src/**/*.ts', 'packages/renderer/src/**/*.tsx'],
    plugins: {
      jsdoc: jsdocPlugin,
    },
    rules: {
      // Enforce JSDoc for public API
      'jsdoc/require-jsdoc': [
        'warn',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
        },
      ],
    },
  },

  // Prettier configuration
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.cjs', '**/*.mjs'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...(prettierConfig.rules || {}),
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    },
  },
];

// Add custom adapter plugin config only if available
if (customPlugin) {
  baseConfig.push({
    files: ['packages/adapter-*/src/adapter.ts'],
    plugins: {
      custom: customPlugin,
    },
    rules: {
      'custom/no-extra-adapter-methods': 'error',
    },
  });
}

module.exports = baseConfig;
