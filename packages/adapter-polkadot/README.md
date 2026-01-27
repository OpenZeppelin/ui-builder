# @openzeppelin/ui-builder-adapter-polkadot

Polkadot adapter for the OpenZeppelin UI Builder. Enables building UIs for EVM-compatible smart contracts deployed on Polkadot ecosystem networks.

## Supported Networks

### Hub Networks (P1 - MVP)

| Network              | Chain ID  | Type    | Relay Chain |
| -------------------- | --------- | ------- | ----------- |
| Polkadot Hub         | 420420419 | Mainnet | Polkadot    |
| Kusama Hub           | 420420418 | Mainnet | Kusama      |
| Polkadot Hub TestNet | 420420417 | Testnet | Polkadot    |

### Parachain Networks (P2)

| Network        | Chain ID | Type    | Relay Chain |
| -------------- | -------- | ------- | ----------- |
| Moonbeam       | 1284     | Mainnet | Polkadot    |
| Moonriver      | 1285     | Mainnet | Kusama      |
| Moonbase Alpha | 1287     | Testnet | Polkadot    |

## Installation

```bash
pnpm add @openzeppelin/ui-builder-adapter-polkadot
```

## Usage

### Basic Usage

```typescript
import { PolkadotAdapter, polkadotHubMainnet } from '@openzeppelin/ui-builder-adapter-polkadot';

// Create adapter for Polkadot Hub
const adapter = new PolkadotAdapter(polkadotHubMainnet);

// Load a contract
const schema = await adapter.loadContract('0x1234...');
```

### Network Selection

```typescript
import {
  kusamaHubMainnet,
  moonbaseAlphaTestnet,
  // Parachain networks (P2)
  moonbeamMainnet,
  moonriverMainnet,
  // Hub networks (P1)
  polkadotHubMainnet,
  polkadotHubTestnet,
  polkadotMainnetNetworks,
  // All networks
  polkadotNetworks,
  polkadotTestnetNetworks,
} from '@openzeppelin/ui-builder-adapter-polkadot';

// Filter networks as needed
const hubNetworks = polkadotNetworks.filter((n) => n.networkCategory === 'hub');
const kusamaNetworks = polkadotNetworks.filter((n) => n.relayChain === 'kusama');
const moonbeam = polkadotNetworks.find((n) => n.chainId === 1284);
```

### Wallet Integration

The adapter provides a pre-configured wallet provider for React applications:

```tsx
import { PolkadotWalletUiRoot } from '@openzeppelin/ui-builder-adapter-polkadot';

function App() {
  return <PolkadotWalletUiRoot>{/* Your app content */}</PolkadotWalletUiRoot>;
}
```

Or if you need to override the default chains:

```tsx
import { polkadotChains, PolkadotWalletUiRoot } from '@openzeppelin/ui-builder-adapter-polkadot';

function App() {
  return (
    <PolkadotWalletUiRoot chains={polkadotChains}>{/* Your app content */}</PolkadotWalletUiRoot>
  );
}
```

## Architecture

The adapter uses a modular architecture that delegates all EVM operations to `@openzeppelin/ui-builder-adapter-evm-core`:

```
adapter-polkadot/
├── src/
│   ├── adapter.ts           # Main PolkadotAdapter class (orchestrator)
│   ├── evm/                  # EVM module - thin wrappers over evm-core
│   │   ├── abi/              # ABI loading (delegates to core)
│   │   ├── configuration/    # RPC/Explorer config (delegates to core)
│   │   ├── query/            # View function queries (delegates to core)
│   │   ├── transaction/      # Transaction execution (delegates to core)
│   │   └── ui/               # UI utilities
│   ├── networks/
│   │   ├── mainnet.ts        # Mainnet configurations (Hub, Moonbeam, etc.)
│   │   ├── testnet.ts        # Testnet configurations
│   │   └── chains.ts         # Custom viem chain definitions
│   └── wallet/
│       ├── implementation.ts # PolkadotWalletImplementation
│       ├── hooks/            # Wagmi hook facades
│       ├── rainbowkit/       # RainbowKit component factories
│       └── PolkadotWalletUiRoot.tsx
```

### Core Package Dependency

This adapter uses `@openzeppelin/ui-builder-adapter-evm-core` for all shared EVM functionality:

- ABI loading and transformation
- Transaction formatting and execution strategies (EOA, Relayer)
- Wallet infrastructure (`WagmiWalletImplementation` interface)
- Input parsing and output formatting
- RPC and explorer configuration utilities

The core package is bundled internally via `tsup` with `noExternal` configuration, ensuring the adapter is self-contained when published.

### Extending for Non-EVM Networks

The architecture supports future addition of non-EVM (Substrate/Wasm) modules:

```typescript
// Future: Add substrate/ module following the same pattern
// src/
// ├── evm/       (current - EVM-compatible networks)
// └── substrate/ (future - native Substrate/Wasm networks)
```

The `PolkadotAdapter` routes operations based on `executionType`:

- `'evm'` → EVM module (current implementation)
- `'substrate'` → Substrate module (future)

## Explorer APIs

| Network Type        | Explorer   | API Version             |
| ------------------- | ---------- | ----------------------- |
| Hub networks        | Blockscout | Etherscan V1 compatible |
| Moonbeam parachains | Moonscan   | Etherscan V2 compatible |

## License

AGPL-3.0
