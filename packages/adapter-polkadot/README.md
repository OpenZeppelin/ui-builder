# @openzeppelin/ui-builder-adapter-polkadot

Polkadot adapter for the OpenZeppelin UI Builder. Enables building UIs for EVM-compatible smart contracts deployed on Polkadot ecosystem networks.

## Supported Networks

### Hub Networks (P1 - MVP)

| Network | Chain ID | Type | Relay Chain |
|---------|----------|------|-------------|
| Polkadot Hub | 420420419 | Mainnet | Polkadot |
| Kusama Hub | 420420418 | Mainnet | Kusama |
| Polkadot Hub TestNet | 420420417 | Testnet | Polkadot |

### Parachain Networks (P2)

| Network | Chain ID | Type | Relay Chain |
|---------|----------|------|-------------|
| Moonbeam | 1284 | Mainnet | Polkadot |
| Moonriver | 1285 | Mainnet | Kusama |
| Moonbase Alpha | 1287 | Testnet | Polkadot |

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
  // Hub networks
  polkadotHubMainnet,
  kusamaHubMainnet,
  polkadotHubTestnet,
  // Parachain networks
  moonbeamMainnet,
  moonriverMainnet,
  moonbaseAlphaTestnet,
  // All networks
  polkadotNetworks,
} from '@openzeppelin/ui-builder-adapter-polkadot';
```

### Utility Functions

```typescript
import {
  getNetworksByCategory,
  getNetworksByRelayChain,
  isHubNetwork,
  isParachainNetwork,
  getNetworkByChainId,
} from '@openzeppelin/ui-builder-adapter-polkadot';

// Filter by category
const hubNetworks = getNetworksByCategory('hub');
const parachainNetworks = getNetworksByCategory('parachain');

// Filter by relay chain
const polkadotChains = getNetworksByRelayChain('polkadot');
const kusamaChains = getNetworksByRelayChain('kusama');

// Type guards
if (isHubNetwork(network)) {
  console.log('This is a Hub network');
}

// Lookup by chain ID
const moonbeam = getNetworkByChainId(1284);
```

### Wallet Integration

The adapter provides a pre-configured wallet provider for React applications:

```tsx
import { PolkadotWalletUiRoot, polkadotChains } from '@openzeppelin/ui-builder-adapter-polkadot';

function App() {
  return (
    <PolkadotWalletUiRoot
      chains={polkadotChains}
      appName="My Polkadot App"
    >
      {/* Your app content */}
    </PolkadotWalletUiRoot>
  );
}
```

## Architecture

The adapter uses a handler-based architecture to support different execution types:

```
adapter-polkadot/
├── src/
│   ├── adapter.ts           # Main PolkadotAdapter class
│   ├── handlers/
│   │   └── evm-handler.ts   # Delegates to adapter-evm-core
│   ├── networks/
│   │   ├── mainnet.ts       # Mainnet configurations
│   │   ├── testnet.ts       # Testnet configurations
│   │   └── chains.ts        # Viem chain definitions
│   ├── wallet/
│   │   └── PolkadotWalletUiRoot.tsx
│   └── utils.ts             # Network utilities
```

### Extending for Non-EVM Networks

The architecture supports future addition of non-EVM (Substrate/Wasm) handlers:

```typescript
// Future: Add substrate-handler.ts following the same pattern
// handlers/
// ├── evm-handler.ts      (current)
// └── substrate-handler.ts (future)
```

The `PolkadotAdapter` routes operations based on `executionType`:
- `'evm'` → EVM handler (current implementation)
- `'substrate'` → Substrate handler (future)

## Explorer APIs

| Network Type | Explorer | API Version |
|--------------|----------|-------------|
| Hub networks | Blockscout | Etherscan V1 compatible |
| Moonbeam parachains | Moonscan | Etherscan V2 compatible |

## License

MIT
