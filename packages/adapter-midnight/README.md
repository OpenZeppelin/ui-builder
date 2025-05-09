# Midnight Adapter (`@openzeppelin/transaction-form-adapter-midnight`)

This package provides the `ContractAdapter` implementation for the Midnight Network for the Transaction Form Builder.

**Note:** While the basic structure is in place, including network configuration definitions, the core adapter logic for Midnight-specific operations is currently a placeholder. Functionality will be added in future development phases as the Midnight Network and its tooling evolve.

It is intended to be responsible for:

- Implementing the `ContractAdapter` interface from `@openzeppelin/transaction-form-types`.
- Defining and exporting specific Midnight network configurations as `MidnightNetworkConfig` objects. These are located in `src/networks/` and will include details relevant to Midnight (e.g., node endpoints, specific chain parameters, explorer URLs).
- Loading Midnight contract metadata (details TBD based on Midnight's tooling).
- Mapping Midnight-specific data types to the form field types.
- Parsing user input into Midnight-compatible transactions, according to the `MidnightNetworkConfig`.
- Formatting results from contract queries.
- Interacting with Midnight wallets for signing and sending transactions on the configured network.
- Providing other Midnight-specific configurations and validation.

## Usage

Once fully implemented, the `MidnightAdapter` class will be instantiated with a specific `MidnightNetworkConfig` object:

```typescript
import { MidnightAdapter } from '@openzeppelin/transaction-form-adapter-midnight';
// Example: import { midnightDevnet } from '@openzeppelin/transaction-form-adapter-midnight';
import { MidnightNetworkConfig } from '@openzeppelin/transaction-form-types';

// For type access if needed

// Placeholder: Actual network config objects would be imported from './networks'
const placeholderNetworkConfig: MidnightNetworkConfig = {
  id: 'midnight-devnet',
  name: 'Midnight Devnet',
  ecosystem: 'midnight',
  network: 'midnight',
  type: 'devnet',
  isTestnet: true,
  explorerUrl: 'https://explorer.midnight.network/devnet', // Hypothetical URL
  // ... any other MidnightNetworkConfig fields (e.g., nodeEndpoint)
};

const midnightAdapter = new MidnightAdapter(placeholderNetworkConfig);

// Use midnightAdapter for operations on the configured Midnight network
```

Network configurations for Midnight networks will be defined and exported from `src/networks/index.ts` within this package. The full list will be exported as `midnightNetworks`.

## Internal Structure

This adapter will follow the standard module structure outlined in the main project [Adapter Architecture Guide](../../docs/ADAPTER_ARCHITECTURE.md), with the `src/networks/` directory for managing its network configurations.
