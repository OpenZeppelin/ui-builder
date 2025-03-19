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

// Custom plugin
const customPlugin = require('./.eslint/index.cjs');

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

// Get the base configuration from the root
const baseConfig = require('../../eslint.config.cjs');

// Only add package-specific overrides
module.exports = [
  ...baseConfig,

  // Core-specific TypeScript configuration with project reference
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
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },

  // Custom rules for adapter pattern enforcement (package-specific)
  {
    files: ['src/adapters/**/*.ts'],
    plugins: {
      custom: customPlugin,
    },
    rules: {
      'custom/no-extra-adapter-methods': 'error',
    },
  },
];
