import type { StorybookConfig } from '@storybook/react-vite';

import path from 'path';

const config: StorybookConfig = {
  stories: [
    // Core package stories
    '../packages/core/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../packages/core/src/**/*.mdx',

    // Form renderer package stories
    '../packages/form-renderer/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../packages/form-renderer/src/**/*.mdx',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  viteFinal: async (config) => {
    // Add path aliases for both packages
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      // Core package aliases
      '@': path.resolve(__dirname, '../packages/core/src'),
      // Form renderer package aliases
      '@form-renderer': path.resolve(__dirname, '../packages/form-renderer/src'),
    };

    return config;
  },
};

export default config;
