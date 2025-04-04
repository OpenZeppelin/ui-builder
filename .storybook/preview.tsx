import type { Preview } from '@storybook/react';

import React from 'react';

// Import the UNIFIED CSS entry point from the core package.
// This now includes Tailwind base, components, utilities, AND the theme variables.
import '../packages/core/src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    options: {
      // Sort stories by package name first, then by component name
      storySort: {
        order: ['Core', 'Form Renderer', 'Styles', 'Templates'],
        method: 'alphabetical',
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f5f5f5' },
        { name: 'dark', value: '#1f2937' },
      ],
    },
    // Properly handle the layout to display components nicely
    layout: 'centered',
  },
  // Add decorators to provide context for component stories
  decorators: [
    (Story) => (
      <div className="m-4 rounded border border-gray-200 p-4">
        <Story />
      </div>
    ),
  ],
};

export default preview;
