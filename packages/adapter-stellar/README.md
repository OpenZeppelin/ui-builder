# Stellar Adapter (`@openzeppelin/transaction-form-adapter-stellar`)

This package provides the `ContractAdapter` implementation for the Stellar network for the Transaction Form Builder.

**Note:** While the basic structure is in place, including network configuration definitions, the core adapter logic for Stellar-specific operations is currently a placeholder and will be implemented in future development phases.

It is intended to be responsible for:

- Implementing the `ContractAdapter` interface from `@openzeppelin/contracts-ui-builder-types`.
- Defining and exporting specific Stellar network configurations (e.g., Public Network, Testnet) as `StellarNetworkConfig` objects. These are located in `src/networks/` and include details like Horizon URLs, network passphrases, and explorer URLs.
- Loading Stellar contract metadata (e.g., from XDR for Soroban contracts).
- Mapping Stellar-specific data types (e.g., Soroban types) to the form field types.
- Parsing user input into Stellar operations/transactions, according to the `StellarNetworkConfig`.
- Formatting results from Horizon API queries or contract state.
- Interacting with Stellar wallets (e.g., via Freighter, Albedo) for signing and submitting transactions on the configured network.
- Providing other Stellar-specific configurations and validation.

## Usage

Once fully implemented, the `StellarAdapter` class will be instantiated with a specific `StellarNetworkConfig` object:

```typescript
// Example: import { stellarPubnet } from '@openzeppelin/transaction-form-adapter-stellar';
import { StellarNetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import { StellarAdapter } from '@openzeppelin/transaction-form-adapter-stellar';

// For type access if needed

// Placeholder: Actual network config objects would be imported from './networks'
const placeholderNetworkConfig: StellarNetworkConfig = {
  id: 'stellar-testnet',
  name: 'Stellar Testnet',
  ecosystem: 'stellar',
  network: 'stellar',
  type: 'testnet',
  isTestnet: true,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  explorerUrl: 'https://stellar.expert/explorer/testnet',
  // ... any other StellarNetworkConfig fields
};

const stellarAdapter = new StellarAdapter(placeholderNetworkConfig);

// Use stellarAdapter for operations on the configured Stellar network
```

Network configurations for Stellar networks (e.g., `stellarPubnet`, `stellarTestnet`) are defined and exported from `src/networks/index.ts` within this package. The full list is exported as `stellarNetworks`.

## Internal Structure

This adapter will follow the standard module structure outlined in the main project [Adapter Architecture Guide](../../docs/ADAPTER_ARCHITECTURE.md), with the `src/networks/` directory for managing its network configurations.
