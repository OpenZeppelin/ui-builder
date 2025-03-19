// Polyfill for structuredClone for Node.js environments that don't support it natively
// This is a temporary solution for compatibility with ESLint 9 and will be removed once
// all dependencies are fully compatible
if (typeof structuredClone !== 'function') {
  global.structuredClone = function (obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      // For circular references or other non-serializable objects, fallback to a shallow copy
      return Object.assign({}, obj);
    }
  };
}

const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const reactRefreshPlugin = require('eslint-plugin-react-refresh');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const simpleImportSortPlugin = require('eslint-plugin-simple-import-sort');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

// Get the base configuration from the root
const baseConfig = require('../../eslint.config.cjs');

// Safely extract configs to handle both ESLint v8 and v9 formats
const getPluginConfigs = (plugin, configName) => {
  try {
    // ESLint v9 format
    if (plugin.configs && plugin.configs[configName] && plugin.configs[configName].rules) {
      return plugin.configs[configName].rules;
    }
    // ESLint v8 format (fallback)
    if (plugin.configs && plugin.configs[configName]) {
      return plugin.configs[configName].rules || {};
    }
    return {};
  } catch (e) {
    console.warn(`Failed to load rules from ${configName}:`, e);
    return {};
  }
};

// We need to get these safely since the structure might differ
const typescriptRecommendedRules = getPluginConfigs(typescriptPlugin, 'recommended');
const reactRecommendedRules = getPluginConfigs(reactPlugin, 'recommended');
const reactHooksRecommendedRules = getPluginConfigs(reactHooksPlugin, 'recommended');

// Only add package-specific overrides
module.exports = [
  ...baseConfig,

  // Form-renderer specific TypeScript configuration with project reference
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': ['warn'],
      '@typescript-eslint/explicit-function-return-type': ['warn'],
    },
  },

  // TypeScript configuration for demo files
  {
    files: ['demo/**/*.ts', 'demo/**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ['./demo/tsconfig.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // Relaxed rules for the demo app
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
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
      'react/prop-types': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Import and sorting rules
  {
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSortPlugin,
    },
    rules: {
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // React and related packages come first
            ['^react', '^react-dom', '^react-.*$'],
            // External packages
            ['^@?\\w'],
            // Internal packages (alias imports)
            ['^@/'],
            // Parent imports (starting with ..)
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // Other relative imports (starting with .)
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // Style imports
            ['^.+\\.s?css$'],
            // Type imports
            ['^.+\\u0000$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },

  // Additional library-specific rules
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
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
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...(prettierConfig.rules || {}),
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    },
  },
];
