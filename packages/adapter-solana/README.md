# Solana Adapter (`@openzeppelin/contracts-ui-builder-adapter-solana`)

This package provides the `ContractAdapter` implementation for the Solana blockchain for the Transaction Form Builder.

**Note:** While the basic structure is in place, including network configuration definitions, the core adapter logic for Solana-specific operations is currently a placeholder and will be implemented in future development phases.

It is intended to be responsible for:

- Implementing the `ContractAdapter` interface from `@openzeppelin/contracts-ui-builder-types`.
- Defining and exporting specific Solana network configurations (e.g., Mainnet Beta, Devnet, Testnet) as `SolanaNetworkConfig` objects. These are located in `src/networks/` and include details like RPC endpoints, cluster information, explorer URLs, and commitment levels.
- Loading Solana program IDLs (Instruction Description Language).
- Mapping Solana-specific data types to the form field types.
- Parsing user input into Solana-compatible transaction instructions, according to the `SolanaNetworkConfig`.
- Formatting results from on-chain program queries.
- Interacting with Solana wallets (e.g., via `@solana/wallet-adapter-base`) for signing and sending transactions on the configured network.
- Providing other Solana-specific configurations and validation.

## Usage

Once fully implemented, the `SolanaAdapter` class will be instantiated with a specific `SolanaNetworkConfig` object:

```typescript
// Example: import { solanaMainnetBeta } from '@openzeppelin/contracts-ui-builder-adapter-solana';
import { SolanaAdapter } from '@openzeppelin/contracts-ui-builder-adapter-solana';
import { SolanaNetworkConfig } from '@openzeppelin/contracts-ui-builder-types';

// For type access if needed

// Placeholder: Actual network config objects would be imported from './networks'
const placeholderNetworkConfig: SolanaNetworkConfig = {
  id: 'solana-devnet',
  name: 'Solana Devnet',
  ecosystem: 'solana',
  network: 'solana',
  type: 'devnet',
  isTestnet: true,
  rpcEndpoint: 'https://api.devnet.solana.com',
  explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
  commitment: 'confirmed',
  // ... any other SolanaNetworkConfig fields
};

const solanaAdapter = new SolanaAdapter(placeholderNetworkConfig);

// Use solanaAdapter for operations on the configured Solana network
```

Network configurations for Solana networks (e.g., `solanaMainnetBeta`, `solanaDevnet`) are defined and exported from `src/networks/index.ts` within this package. The full list is exported as `solanaNetworks`.

## Internal Structure

This adapter will follow the standard module structure outlined in the main project [Adapter Architecture Guide](../../docs/ADAPTER_ARCHITECTURE.md), with the `src/networks/` directory for managing its network configurations.
