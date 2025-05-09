# EVM Adapter (`@openzeppelin/transaction-form-adapter-evm`)

This package provides the `ContractAdapter` implementation for EVM-compatible blockchains (Ethereum, Polygon, BSC, etc.) for the Transaction Form Builder.

It is responsible for:

- Implementing the `ContractAdapter` interface from `@openzeppelin/transaction-form-types`.
- Defining and exporting specific EVM network configurations (e.g., Ethereum Mainnet, Sepolia Testnet) as `EvmNetworkConfig` objects. These are located in `src/networks/` and include details like RPC URLs, Chain IDs, explorer URLs, and native currency information.
- Loading contract ABIs (from JSON strings or via Etherscan, using the `apiUrl` from the provided `EvmNetworkConfig`).
- Mapping EVM-specific data types to the form field types used by the form builder.
- Parsing user input (including complex types like structs and arrays) into EVM-compatible transaction data, according to the `EvmNetworkConfig`.
- Formatting results from view function calls.
- Interacting with EVM wallets (via Wagmi/Viem) for signing and broadcasting transactions on the configured network.
- Providing other EVM-specific configurations and validation (e.g., for execution methods).

## Usage

The `EvmAdapter` class is instantiated with a specific `EvmNetworkConfig` object, making it aware of the target network from its creation:

```typescript
import { EvmAdapter, ethereumSepolia } from '@openzeppelin/transaction-form-adapter-evm';

// Or any other exported EvmNetworkConfig

const networkConfig = ethereumSepolia;
const evmAdapter = new EvmAdapter(networkConfig);

// Now use evmAdapter for operations on the Ethereum Sepolia testnet
```

Network configurations for various EVM chains (mainnets and testnets) are exported from `src/networks/index.ts` within this package (e.g., `ethereumMainnet`, `polygonMainnet`, `ethereumSepolia`, `polygonAmoy`). The full list of available networks is exported as `evmNetworks`.

## Internal Structure

This adapter generally follows the standard module structure outlined in the main project [Adapter Architecture Guide](../../docs/ADAPTER_ARCHITECTURE.md), with the addition of the `src/networks/` directory for managing network configurations.
