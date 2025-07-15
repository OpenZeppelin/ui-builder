import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    // Builder package stories
    '../packages/builder/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../packages/builder/src/**/*.mdx',

    // Form renderer package stories
    '../packages/renderer/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../packages/renderer/src/**/*.mdx',
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
      // Builder package aliases
      '@': path.resolve(__dirname, '../packages/builder/src'),
      // Styles package alias
      '@styles': path.resolve(__dirname, '../packages/styles'),
    };

    return config;
  },
};

export default config;
