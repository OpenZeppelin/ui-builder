/**
 * Form Renderer Configuration
 *
 * This file defines the dependencies required for different field types
 * and core dependencies for the form renderer.
 */
import type { FormRendererConfig } from './types/FormRendererConfig';

/**
 * Configuration for the form renderer package
 * Used by the export system to determine dependencies for exported forms
 */
export const formRendererConfig: FormRendererConfig = {
  // Core dependencies required by all exported forms
  coreDependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    'react-hook-form': '^7.45.4',
    '@radix-ui/react-label': '^2.0.2',
    '@radix-ui/react-slot': '^1.0.2',
    'class-variance-authority': '^0.7.0',
    clsx: '^2.0.0',
    'tailwind-merge': '^1.14.0',
    '@openzeppelin/transaction-form-renderer': '^0.1.0',
    '@openzeppelin/transaction-form-types': '^0.1.0',
  },

  // Field-specific dependencies
  fieldDependencies: {
    // Text field dependencies
    text: {
      runtimeDependencies: {},
    },

    // Number field dependencies
    number: {
      runtimeDependencies: {},
    },

    // Address field dependencies
    address: {
      runtimeDependencies: {},
    },

    // Boolean field dependencies
    checkbox: {
      runtimeDependencies: {
        '@radix-ui/react-checkbox': '^1.0.4',
      },
    },

    // Select field dependencies
    select: {
      runtimeDependencies: {
        '@radix-ui/react-select': '^1.2.2',
      },
    },

    // Radio field dependencies
    radio: {
      runtimeDependencies: {
        '@radix-ui/react-radio-group': '^1.1.3',
      },
    },

    // Date field dependencies
    date: {
      runtimeDependencies: {
        'react-datepicker': '^4.16.0',
      },
      devDependencies: {
        '@types/react-datepicker': '^4.11.2',
      },
    },

    // Amount field dependencies
    amount: {
      runtimeDependencies: {},
    },

    // Progress component dependencies
    progress: {
      runtimeDependencies: {
        '@radix-ui/react-progress': '^1.0.3',
      },
    },
  },
};
