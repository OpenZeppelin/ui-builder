# @openzeppelin/contracts-ui-builder-utils

This package provides a set of shared, framework-agnostic utility functions used across the entire Contracts UI Builder ecosystem.

## Purpose

The goal of this package is to centralize common logic that is not tied to any specific blockchain adapter or UI framework (like React). This prevents code duplication and ensures that core functionalities like logging, configuration management, and ID generation are consistent everywhere.

## Key Exports

- **`AppConfigService`**: A singleton service responsible for loading and providing runtime configuration. It can load settings from Vite environment variables (for the builder app) or a `public/app.config.json` file (for exported apps), allowing for flexible configuration of RPC URLs, API keys, and other parameters.
- **`logger`**: A pre-configured singleton logger for consistent, leveled logging across all packages. It can be enabled, disabled, or have its level changed globally.
- **`generateId`**: A utility for generating unique IDs (UUID v4), used for form fields and other components.
- **`cn`**: A utility (a wrapper around `clsx` and `tailwind-merge`) for conditionally joining CSS class names, essential for building dynamic and themeable UI components with Tailwind CSS.
- **Type Guards and Helpers**: Various other small, reusable functions like `getDefaultValueForType`.

## Installation

This package is a core part of the monorepo and is automatically linked via `pnpm` workspaces. For external use, it would be installed from the project's package registry.

```bash
pnpm add @openzeppelin/contracts-ui-builder-utils
```
