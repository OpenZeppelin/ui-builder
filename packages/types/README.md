# Transaction Form Types

This package contains shared TypeScript type definitions for the OpenZeppelin Transaction Form Builder ecosystem.

[![npm version](https://img.shields.io/npm/v/@openzeppelin/contracts-ui-builder-types.svg)](https://www.npmjs.com/package/@openzeppelin/contracts-ui-builder-types)

## Purpose

This package serves as the single source of truth for all shared types used across the Transaction Form Builder packages, including:

- Contract and blockchain related types
- Form field and layout definitions
- Adapter interfaces

By centralizing type definitions, we ensure consistency across all packages and eliminate type duplication.

## Installation

```bash
# Using npm
npm install @openzeppelin/contracts-ui-builder-types

# Using yarn
yarn add @openzeppelin/contracts-ui-builder-types

# Using pnpm
pnpm add @openzeppelin/contracts-ui-builder-types
```

## Usage

The package is organized into namespaces for better organization and to prevent naming collisions.

```typescript
// Import everything
import { adapters, contracts, forms } from '@openzeppelin/contracts-ui-builder-types';

// Import specific namespaces
import * as contracts from '@openzeppelin/contracts-ui-builder-types';
import * as adapters from '@openzeppelin/contracts-ui-builder-types';
import * as forms from '@openzeppelin/contracts-ui-builder-types';

// Import specific types from their respective namespaces
import { ContractAdapter } from '@openzeppelin/contracts-ui-builder-types';
import { FieldType, FormFieldType } from '@openzeppelin/contracts-ui-builder-types';

// Example usage in a function
function validateField(field: forms.FormFieldType): boolean {
  // Implementation
  return true;
}
```

## Package Structure

The package is organized into the following directories and files:

```
types/
├── src/
│   ├── adapters/           # Contract adapter interfaces
│   │   ├── base.ts         # Core ContractAdapter interface
│   │   ├── contract-state.ts # Contract state querying capabilities
│   │   └── index.ts        # Re-exports all adapter types
│   ├── common/             # Common types shared across namespaces
│   │   ├── ecosystem.ts    # NetworkEcosystem enum/type
│   │   └── index.ts        # Re-exports common types
│   ├── config/             # Types for runtime application configuration
│   │   └── app-config.ts   # Defines AppRuntimeConfig and related types
│   ├── contracts/          # Contract schema related types
│   │   ├── schema.ts       # ContractSchema, ContractFunction etc.
│   │   └── index.ts        # Re-exports contract types
│   ├── execution/          # Types for transaction execution methods
│   │   ├── eoa.ts
│   │   ├── relayer.ts
│   │   └── ...
│   ├── forms/              # Form field, layout, schema, and validation definitions
│   │   ├── fields.ts       # Base FieldType definitions
│   │   ├── form-field.ts   # FormField definition
│   │   ├── layout.ts       # FormLayout definitions
│   │   ├── schema.ts       # RenderFormSchema, BuilderFormConfig definitions
│   │   ├── validation.ts   # FieldValidation definitions
│   │   ├── values.ts       # FormValues type
│   │   └── index.ts        # Re-exports all form types
│   ├── networks/           # Network configuration types
│   │   ├── config.ts       # Defines BaseNetworkConfig, EvmNetworkConfig, SolanaNetworkConfig, etc., NetworkConfig union type, and type guards
│   │   ├── validation.ts   # Network configuration validation utilities
│   │   ├── README.md       # Documentation for network types
│   │   └── index.ts        # Re-exports all network types
│   ├── transactions/       # Types related to transaction submission status
│   │   ├── status.ts       # TransactionStatus types
│   │   └── index.ts        # Re-exports transaction types
│   └── index.ts            # Main entry point that re-exports all modules
├── package.json            # Package configuration
└── tsconfig.json           # TypeScript configuration
```

## Type Definitions

### Adapter Types (`./src/adapters`)

Interfaces for blockchain-specific adapters:

- `ContractAdapter`: The core interface defining methods for loading contracts, mapping types, querying state, formatting data, validating addresses, handling transactions, and interacting with wallets. It can also now optionally provide methods to facilitate richer, ecosystem-specific UI experiences, such as:
  - `signAndBroadcast`: The core method for submitting a transaction, now using an `ExecutionConfig` to determine the submission strategy (e.g., `EOA` or `Relayer`).
  - `getRelayers?`: An optional method to fetch a list of available relayers for the adapter's ecosystem.
  - `getRelayer?`: An optional method to fetch detailed information about a specific relayer.
  - `getRelayerOptionsComponent?`: An optional method that returns a React component for configuring relayer-specific options (e.g., custom gas settings).
  - `configureUiKit?`: To inform the adapter about a desired UI kit (e.g., for wallet connection modals) and its configuration. The `kitConfig` within this configuration can include an optional `components: { exclude: [...] }` property to prevent specific default UI components (like `NetworkSwitcher`) from being provided by the adapter.
  - `getEcosystemReactUiContextProvider?`: To obtain a React component that sets up necessary UI context (like WagmiProvider for EVM).
  - `getEcosystemReactHooks?`: To get a set of facade React hooks for common wallet operations, abstracting direct library hook usage. Adapters implementing this should aim to return objects from these hooks with conventionally named properties (e.g., `{ isConnected, address, chainId }` for an account hook, or `{ switchChain, isPending, error }` for a network switching hook) to ensure consistent consumption.
  - `getEcosystemWalletComponents?`: To retrieve standardized UI components (e.g., Connect Button) sourced from the configured UI kit or a basic custom implementation provided by the adapter.
    These optional methods allow the main application to leverage advanced UI patterns of specific ecosystems (like EVM with `wagmi/react`) while remaining decoupled from the underlying libraries.

### Config Types (`./src/config`)

- `AppRuntimeConfig`: Defines the shape of the `app.config.json` file used by exported applications to configure runtime settings like RPC endpoints and API keys.

### Common Types (`./src/common`)

Shared foundational types:

- `NetworkEcosystem`: Enum or type defining supported blockchain ecosystems (e.g., 'evm', 'solana').

### Contract Types (`./src/contracts`)

Types related to blockchain contract structure:

- `ContractSchema`: Interface for contract schema definitions (ABI in EVM).
- `ContractFunction`: Interface for function definitions within a contract.
- `ContractParameter`: Interface for function parameter definitions.

### Form Types (`./src/forms`)

Types for form structure, rendering, and handling:

- `FieldType`: Types of form fields (text, number, boolean, address, select, etc.).
- `FormField`: Complete definition of a form field including ID, type, label, validation, etc.
- `RenderFormSchema`: The schema used by the renderer package.
- `BuilderFormConfig`: The configuration used by the form builder UI.
- `FieldValidation`: Validation rules for form fields.
- `FormValues`: Type representing the collected data from a form submission.

### Network Types (`./src/networks`)

Types for defining specific blockchain network configurations:

- Interfaces for common properties (`BaseNetworkConfig`) and ecosystem-specific details (`EvmNetworkConfig`, `SolanaNetworkConfig`, `StellarNetworkConfig`, `MidnightNetworkConfig`).
- The discriminated union type `NetworkConfig` representing any valid network configuration.
- Type guard functions (e.g., `isEvmNetworkConfig(config)`) to safely narrow down the `NetworkConfig` union type.
- (These are primarily defined within `config.ts`)

### Execution Types (`./src/execution`)

- Types related to transaction execution strategies, such as `EoaExecutionConfig`, `RelayerExecutionConfig`, and `RelayerDetails`.

### Transaction Types (`./src/transactions`)

Types related to the status of transaction submissions:

- `TransactionStatus`: Enum or type defining possible states (Idle, Signing, Broadcasting, PendingConfirmation, **PendingRelayer**, Success, Error).
- `TransactionProgress`: Interface potentially holding details like transaction hash, error messages, explorer links.

## Integration with Other Packages

This package is a dependency for both the builder and renderer packages:

- **Builder Package**: Uses these types for its adapter implementations, form generation, and export functionality
- **Renderer Package**: Uses these types for form field rendering and validation

## Development

### Building

```bash
# From the monorepo root
pnpm --filter @openzeppelin/contracts-ui-builder-types build

# Or from within the types package directory
pnpm build
```

### Testing

```bash
# From the monorepo root
pnpm --filter @openzeppelin/contracts-ui-builder-types test

# Or from within the types package directory
pnpm test
```

## License

[MIT](https://github.com/OpenZeppelin/contracts-ui-builder/blob/main/LICENSE) © OpenZeppelin
