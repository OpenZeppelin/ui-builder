# Transaction Form Types

This package contains shared TypeScript type definitions for the OpenZeppelin Transaction Form Builder ecosystem.

## Purpose

This package serves as the single source of truth for all shared types used across the Transaction Form Builder packages, including:

- Contract and blockchain related types
- Form field and layout definitions
- Adapter interfaces

## Usage

```typescript
// Import specific types from their respective namespaces
// Or import from the main package
import { adapters, contracts, forms } from '@openzeppelin/transaction-form-types';
import { ContractAdapter } from '@openzeppelin/transaction-form-types/adapters';
import { ChainType } from '@openzeppelin/transaction-form-types/contracts';
import { FieldType } from '@openzeppelin/transaction-form-types/forms';
```

## Structure

The package is organized into the following directories:

- `/adapters` - Contract adapter interfaces
- `/contracts` - Contract and blockchain related types
- `/forms` - Form field and layout definitions

## License

MIT
