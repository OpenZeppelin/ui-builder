import type { FormRendererConfig } from './types/FormRendererConfig';

/**
 * Configuration for the form-renderer package
 *
 * This file defines dependencies required by the form-renderer package
 * and its various field types when generating exported projects.
 */
export const formRendererConfig: FormRendererConfig = {
  /**
   * Dependencies for specific field types
   * Only dependencies for fields used in a form will be included in exports
   */
  fieldDependencies: {
    // TODO: Review and update with real, verified dependencies and versions before production release

    // Date field dependencies
    date: {
      runtimeDependencies: {
        'react-datepicker': '^4.15.0',
        'date-fns': '^2.30.0',
      },
      devDependencies: {
        '@types/react-datepicker': '^4.11.2',
      },
    },

    // Select field dependencies
    select: {
      runtimeDependencies: {
        'react-select': '^5.7.4',
        '@radix-ui/react-select': '^1.2.2',
      },
      devDependencies: {
        '@types/react-select': '^5.0.1',
      },
    },

    // Radio field dependencies
    radio: {
      runtimeDependencies: {
        '@radix-ui/react-radio-group': '^1.1.3',
      },
    },

    // Checkbox field dependencies
    checkbox: {
      runtimeDependencies: {
        '@radix-ui/react-checkbox': '^1.0.4',
      },
    },

    // File upload field dependencies
    file: {
      runtimeDependencies: {
        'react-dropzone': '^14.2.3',
      },
      devDependencies: {
        '@types/react-dropzone': '^5.1.0',
      },
    },

    // Amount field dependencies (for currency/token inputs)
    amount: {
      runtimeDependencies: {
        'react-number-format': '^5.3.0',
      },
    },

    // Address field dependencies (for blockchain addresses)
    address: {
      runtimeDependencies: {
        'react-identicons': '^1.2.5',
      },
    },

    // TextArea field dependencies
    textarea: {
      runtimeDependencies: {
        '@radix-ui/react-textarea': '^1.0.2',
      },
    },

    // Basic field types without special dependencies
    text: { runtimeDependencies: {} },
    number: { runtimeDependencies: {} },
    email: { runtimeDependencies: {} },
    password: { runtimeDependencies: {} },
    hidden: { runtimeDependencies: {} },
  },

  /**
   * Core dependencies required by form-renderer
   * These will be included in all exported projects
   */
  coreDependencies: {
    // React and core libraries
    react: '^18.2.0',
    'react-dom': '^18.2.0',

    // Form management
    'react-hook-form': '^7.45.4',
    zod: '^3.22.2',
    '@hookform/resolvers': '^3.3.1',

    // UI components
    '@radix-ui/react-label': '^2.0.2',
    '@radix-ui/react-slot': '^1.0.2',
    '@radix-ui/react-toast': '^1.1.4',
    'class-variance-authority': '^0.7.0',
    'tailwind-merge': '^1.14.0',
    clsx: '^2.0.0',

    // The form-renderer package itself
    '@openzeppelin/transaction-form-builder-form-renderer': '^1.0.0',
  },
};
