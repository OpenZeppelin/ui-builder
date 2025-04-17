# Transaction Form Types

This package contains shared TypeScript type definitions for the OpenZeppelin Transaction Form Builder ecosystem.

[![npm version](https://img.shields.io/npm/v/@openzeppelin/transaction-form-types.svg)](https://www.npmjs.com/package/@openzeppelin/transaction-form-types)

## Purpose

This package serves as the single source of truth for all shared types used across the Transaction Form Builder packages, including:

- Contract and blockchain related types
- Form field and layout definitions
- Adapter interfaces

By centralizing type definitions, we ensure consistency across all packages and eliminate type duplication.

## Installation

```bash
# Using npm
npm install @openzeppelin/transaction-form-types

# Using yarn
yarn add @openzeppelin/transaction-form-types

# Using pnpm
pnpm add @openzeppelin/transaction-form-types
```

## Usage

The package is organized into namespaces for better organization and to prevent naming collisions.

```typescript
// Import everything
import { adapters, contracts, forms } from '@openzeppelin/transaction-form-types';

// Import specific namespaces
import * as contracts from '@openzeppelin/transaction-form-types/contracts';
import * as adapters from '@openzeppelin/transaction-form-types/adapters';
import * as forms from '@openzeppelin/transaction-form-types/forms';

// Import specific types from their respective namespaces
import { ContractAdapter } from '@openzeppelin/transaction-form-types/adapters';
import { ChainType } from '@openzeppelin/transaction-form-types/contracts';
import { FieldType, FormFieldType } from '@openzeppelin/transaction-form-types/forms';

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
│   ├── adapters/         # Contract adapter interfaces
│   │   ├── base.ts       # Core adapter interface
│   │   ├── contract-state.ts # Contract state querying capabilities
│   │   └── index.ts      # Re-exports all adapter types
│   ├── contracts/        # Contract and blockchain related types
│   │   ├── chains.ts     # Chain type definitions
│   │   ├── schema.ts     # Contract schema interfaces
│   │   └── index.ts      # Re-exports all contract types
│   ├── forms/            # Form field and layout definitions
│   │   ├── fields.ts     # Field type definitions
│   │   ├── form-field.ts # Form field definitions
│   │   ├── layout.ts     # Layout type definitions
│   │   ├── validation.ts # Validation type definitions
│   │   ├── schema.ts     # Form schema definitions
│   │   └── index.ts      # Re-exports all form types
│   └── index.ts          # Main entry point that re-exports all modules
├── package.json          # Package configuration
└── tsconfig.json         # TypeScript configuration
```

## Type Definitions

### Adapter Types

The `adapters` namespace provides interfaces for blockchain-specific adapters, including:

- `ContractAdapter`: The base interface that all chain-specific adapters must implement
- Contract state and execution related interfaces

### Contract Types

The `contracts` namespace contains types related to blockchain contracts:

- `ChainType`: Enum of supported blockchain types
- `ContractSchema`: Interface for contract schema definitions
- `ContractFunction`: Interface for function definitions within a contract

### Form Types

The `forms` namespace includes types for form rendering and handling:

- `FieldType`: Types of form fields (text, number, checkbox, etc.)
- `FormFieldType`: Complete definition of a form field with validation
- `FormLayout`: Layout configuration for forms
- `FieldValidation`: Validation rules for form fields

## Integration with Other Packages

This package is a dependency for both the core and form-renderer packages:

- **Core Package**: Uses these types for its adapter implementations, form generation, and export functionality
- **Form Renderer Package**: Uses these types for form field rendering and validation

## Development

### Building

```bash
# From the monorepo root
pnpm --filter @openzeppelin/transaction-form-types build

# Or from within the types package directory
pnpm build
```

### Testing

```bash
# From the monorepo root
pnpm --filter @openzeppelin/transaction-form-types test

# Or from within the types package directory
pnpm test
```

## License

[MIT](https://github.com/OpenZeppelin/transaction-form-builder/blob/main/LICENSE) © OpenZeppelin
