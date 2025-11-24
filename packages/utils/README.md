# @openzeppelin/ui-builder-utils

This package provides a set of shared, framework-agnostic utility functions used across the entire UI Builder ecosystem.

## Purpose

The goal of this package is to centralize common logic that is not tied to any specific blockchain adapter or UI framework (like React). This prevents code duplication and ensures that core functionalities like logging, configuration management, and ID generation are consistent everywhere.

## Key Exports

- **`AppConfigService`**: A singleton service responsible for loading and providing runtime configuration. It can load settings from Vite environment variables (for the builder app) or a `public/app.config.json` file (for exported apps), allowing for flexible configuration of RPC URLs, API keys, indexer endpoints, and other parameters.
  - **RPC Endpoints**: Override default RPC URLs per network via `getRpcEndpointOverride(networkId)`.
  - **Indexer Endpoints**: Override default indexer URLs per network via `getIndexerEndpointOverride(networkId)` for historical data queries.
  - **API Keys**: Retrieve explorer API keys via `getExplorerApiKey(serviceId)`.
  - **Global Services**: Access global service parameters like WalletConnect project IDs.
  - **Feature Flags**: Check feature enablement via `isFeatureEnabled(flagName)`.
- **`logger`**: A pre-configured singleton logger for consistent, leveled logging across all packages. It can be enabled, disabled, or have its level changed globally.
- **`generateId`**: A utility for generating unique IDs, used for form fields and other components.
- **`cn`**: A utility (a wrapper around `clsx` and `tailwind-merge`) for conditionally joining CSS class names, essential for building dynamic and themeable UI components with Tailwind CSS.
- **Access Control Utilities** (`./src/access/`): Chain-agnostic utilities for access control operations:
  - **`validateSnapshot`**: Validates the structure of an `AccessSnapshot` object
  - **`serializeSnapshot`**: Serializes an access snapshot to JSON string
  - **`deserializeSnapshot`**: Deserializes a JSON string to an access snapshot
  - **`createEmptySnapshot`**: Creates an empty snapshot with no roles and no ownership
  - **`findRoleAssignment`**: Finds a role assignment by role ID
  - **`compareSnapshots`**: Compares two snapshots and returns differences
  - **`isAccessControlError`**: Type guard to check if an error is an AccessControlError
- **Address Normalization** (`normalizeAddress`, `addressesEqual`): Utilities for normalizing and comparing addresses in a chain-agnostic way.
- **Type Guards and Helpers**: Various other small, reusable functions like `getDefaultValueForType`.

## Package Structure

```text
utils/
├── src/
│   ├── access/                 # Access control utilities (snapshot, errors)
│   ├── config/                 # Configuration management
│   ├── logger/                 # Logging utilities
│   ├── ui/                     # UI utility functions
│   ├── validation/             # Validation and type utilities
│   ├── constants/              # Shared constants
│   └── index.ts                # Main package exports
├── package.json                # Package configuration
├── tsconfig.json               # TypeScript configuration
├── tsup.config.ts              # Build configuration
├── vitest.config.ts            # Test configuration
└── README.md                   # This documentation
```

## Installation

This package is a core part of the monorepo and is automatically linked via `pnpm` workspaces. For external use, it would be installed from the project's package registry.

```bash
pnpm add @openzeppelin/ui-builder-utils
```
