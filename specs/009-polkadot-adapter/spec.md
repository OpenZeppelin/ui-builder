# Feature Specification: Polkadot Adapter

**Feature Branch**: `009-polkadot-adapter`  
**Created**: 2026-01-24  
**Status**: Draft  
**Input**: User description: "Create a new Polkadot adapter with initial EVM parachain support. But make sure it's ready for the future non-evm parachains too."

## Clarifications

### Session 2026-01-24

- Q: Should this be `adapter-polkadot-evm` or `adapter-polkadot`? → A: `adapter-polkadot` - the adapter should represent the entire Polkadot ecosystem and be extensible for future non-EVM parachains (native Substrate/Wasm chains).

### Session 2026-01-08 - Wagmi Version Decision

**Decision: Use Wagmi v2 (same as adapter-evm)**

While the [official Polkadot documentation](https://docs.polkadot.com/smart-contracts/libraries/wagmi/) demonstrates Wagmi v3, the adapter will use **Wagmi v2** for the following reasons:

1. **Chain configurations are identical** - The custom chain definition format (chain ID, RPC URL, native currency) is the same in both v2 and v3
2. **RainbowKit compatibility** - RainbowKit v2 works with Wagmi v2; RainbowKit v3 (for Wagmi v3) is not yet released
3. **Consistency with existing adapters** - The `adapter-evm` already uses Wagmi v2
4. **No functional differences** - Polkadot Hub is a standard EVM chain and doesn't require any v3-specific features
5. **viem chain definitions** - Custom chain definitions for Polkadot Hub work in both versions

**Key difference between v2 and v3 is only hook naming:**

- v2: `useAccount`, `useSwitchAccount`
- v3: `useConnection`, `useSwitchConnection`

**This means:**

- ✅ No dependency on `010-wagmi-v3-upgrade` spec
- ✅ RainbowKit wallet UI works out of the box
- ✅ Adapter can proceed independently

### Session 2026-01-08 - Network Priority & Explorer APIs

**Network Priority Order:**

1. **P1 (Primary)**: Polkadot Hub, Kusama Hub, Polkadot Hub TestNet - Official system chains with EVM via PolkaVM/REVM
2. **P2 (Secondary)**: Moonbeam, Moonriver, Moonbase Alpha - Independent EVM-first parachains
3. **P3 (Future)**: Astar, Shiden - Hybrid EVM/Wasm parachains

**Explorer API Discovery:**

- **Polkadot/Kusama Hub** use **Blockscout** explorers (Etherscan V1 API compatible!)
  - Polkadot Hub: `https://blockscout.polkadot.io/api`
  - Kusama Hub: `https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io/api`
  - API format: Etherscan-compatible (`?module=contract&action=getabi`) - uses existing `loadAbiFromEtherscanV1`
- **Moonbeam/Moonriver** use **Moonscan** (Etherscan V2 compatible)
  - Uses existing `loadAbiFromEtherscanV2` from `adapter-evm-core`

**Key Simplification:** Blockscout supports the Etherscan V1 API format, so NO new ABI loader is needed in `adapter-evm-core`. We just configure the network with the Blockscout API URL.

**Network Details:**
| Network | Chain ID | Currency | RPC URL | Explorer Type |
|---------|----------|----------|---------|---------------|
| Polkadot Hub | 420420419 | DOT | `https://services.polkadothub-rpc.com` | Blockscout |
| Kusama Hub | 420420418 | KSM | `https://kusama-asset-hub-eth-rpc.polkadot.io` | Blockscout |
| Polkadot Hub TestNet | 420420417 | PAS | `https://services.polkadothub-rpc.com/testnet` | Blockscout |
| Moonbeam | 1284 | GLMR | `https://rpc.api.moonbeam.network` | Moonscan (Etherscan V2) |
| Moonriver | 1285 | MOVR | `https://rpc.api.moonriver.moonbeam.network` | Moonscan (Etherscan V2) |
| Moonbase Alpha | 1287 | DEV | `https://rpc.api.moonbase.moonbeam.network` | Moonscan (Etherscan V2) |

**Architecture Decision - No Core Changes Needed:**
Blockscout supports the Etherscan V1 API format (`?module=contract&action=getabi`), so we can use the existing `loadAbiFromEtherscanV1` function from `adapter-evm-core`. This means **no changes to `adapter-evm-core` are required** - we only need to create the `adapter-polkadot` package with appropriate network configurations.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - User Interacts with Polkadot Hub Contract (Priority: P1)

A user wants to interact with a smart contract deployed on **Polkadot Hub** (the official Polkadot system chain with EVM support via PolkaVM/REVM). They select "Polkadot" as the ecosystem in the UI Builder, choose "Polkadot Hub" network, and can then load contracts, query view functions, and execute transactions.

**Why this priority**: Polkadot Hub is the official EVM-enabled system chain launched in late 2025. It represents Polkadot's canonical smart contract platform with native DOT as gas currency.

**Independent Test**: Can be fully tested by selecting Polkadot ecosystem, choosing Polkadot Hub TestNet, loading a verified contract from Blockscout, and successfully querying a view function.

**Acceptance Scenarios**:

1. **Given** the user is in the UI Builder, **When** they select the "Polkadot" ecosystem, **Then** they see "Polkadot Hub", "Kusama Hub", and "Polkadot Hub TestNet" as the first network options.

2. **Given** the user has selected Polkadot Hub, **When** they enter a verified contract address, **Then** the system loads the contract ABI from Blockscout API and displays available functions.

3. **Given** the user has loaded a contract on Kusama Hub, **When** they query a view function with valid parameters, **Then** the result is displayed correctly without requiring a wallet connection.

4. **Given** the user has connected their wallet (e.g., MetaMask configured for Polkadot Hub chain ID 420420419), **When** they execute a state-changing transaction, **Then** the transaction is signed, broadcast, and confirmed on the Polkadot Hub network.

---

### User Story 2 - User Interacts with Moonbeam Parachain Contract (Priority: P2)

A user wants to interact with a smart contract deployed on **Moonbeam** or **Moonriver** (independent EVM-first parachains). They select "Polkadot" as the ecosystem, choose their target network (e.g., Moonbeam Mainnet), and interact with contracts using Moonscan for ABI loading.

**Why this priority**: While important, Moonbeam/Moonriver are secondary to the official Hub chains. They use Etherscan V2 APIs which are already supported in `adapter-evm-core`.

**Independent Test**: Can be tested by selecting Polkadot ecosystem, choosing Moonbase Alpha, loading a verified contract via Moonscan, and querying a view function.

**Acceptance Scenarios**:

1. **Given** the user is in the UI Builder with Polkadot ecosystem selected, **When** they view available networks, **Then** they see Moonbeam, Moonriver, and Moonbase Alpha listed after the Hub networks.

2. **Given** the user has selected Moonbeam Mainnet, **When** they enter a verified contract address, **Then** the system loads the contract ABI from Moonscan (Etherscan V2 API) and displays available functions.

3. **Given** the user has loaded a contract on Moonriver, **When** they query a view function with valid parameters, **Then** the result is displayed correctly without requiring a wallet connection.

4. **Given** the user has connected their wallet (e.g., MetaMask configured for Moonbeam), **When** they execute a state-changing transaction, **Then** the transaction is signed, broadcast, and confirmed on the Moonbeam network.

---

### User Story 3 - Developer Exports Polkadot App (Priority: P1)

A developer has built a contract UI for a Polkadot Hub or Moonbeam-deployed contract using the UI Builder. They want to export it as a standalone application that users can run independently.

**Why this priority**: Export functionality is essential for the UI Builder's value proposition. Users need to be able to deploy their contract UIs as standalone applications.

**Independent Test**: Can be tested by exporting a Polkadot Hub contract UI and running the exported app successfully.

**Acceptance Scenarios**:

1. **Given** the user has completed building a contract UI for a Polkadot Hub contract, **When** they export the application, **Then** the exported app includes the Polkadot adapter with all necessary dependencies.

2. **Given** an exported Polkadot EVM app, **When** a user runs `npm install && npm run dev`, **Then** the application starts and connects to the correct network.

3. **Given** an exported app for Kusama Hub, **When** a user interacts with the contract, **Then** all transactions execute correctly on the Kusama Hub network.

---

### User Story 4 - Polkadot Ecosystem Appears Separate from Ethereum (Priority: P2)

Users should see "Polkadot" as a distinct ecosystem option in the UI Builder, separate from "Ethereum" (which contains Mainnet, Polygon, Arbitrum, etc.). This clearly communicates that while Polkadot parachains may be EVM-compatible, they are part of the Polkadot ecosystem.

**Why this priority**: Clear ecosystem separation is important for user understanding and branding, but the core functionality (P1) takes precedence.

**Independent Test**: Can be tested by verifying the UI displays Polkadot as a separate ecosystem with its own network list.

**Acceptance Scenarios**:

1. **Given** a user opens the ecosystem selection, **When** they view available options, **Then** they see "Polkadot" as a distinct choice alongside "Ethereum", "Solana", and "Stellar".

2. **Given** the user selects "Polkadot", **When** they view networks, **Then** they see Polkadot Hub networks first, followed by independent parachains like Moonbeam.

3. **Given** the user switches from Polkadot to Ethereum ecosystem, **When** they view networks, **Then** the network list updates to show Ethereum-native networks (Mainnet, Polygon, Arbitrum, etc.).

---

### User Story 5 - Architecture Ready for Non-EVM Parachains (Priority: P3)

The adapter architecture should be designed to accommodate future non-EVM parachains (native Substrate/Wasm chains) without requiring a complete rewrite. This is a design consideration, not an immediate implementation.

**Why this priority**: Future-proofing is valuable but should not delay the initial EVM parachain release. The architecture should be extensible, but non-EVM implementation is out of scope for this feature.

**Independent Test**: Can be validated by code review confirming the adapter structure allows for adding a Substrate handler alongside the EVM handler.

**Acceptance Scenarios**:

1. **Given** the adapter package structure, **When** a developer reviews the code, **Then** they can identify a clear path to add non-EVM parachain support without restructuring the adapter.

2. **Given** a network configuration, **When** it specifies an execution type, **Then** the adapter can route to the appropriate handler (currently only EVM, but extensible).

---

### Edge Cases

- What happens when a user tries to use Polkadot Hub with a wallet configured for Ethereum Mainnet? (Answer: The adapter should detect chain mismatch and prompt the user to switch networks in their wallet to chain ID 420420419)
- How does the system handle parachains that support both EVM and Wasm contracts (like Astar)? (Answer: Initially, only EVM is supported; the network config specifies `executionType: 'evm'`)
- What happens if Blockscout API is unavailable for Polkadot Hub? (Answer: Fall back to Sourcify, same as EVM adapter behavior using core modules)
- What happens if Moonscan API is unavailable for Moonbeam? (Answer: Fall back to Sourcify, same as EVM adapter behavior using core modules)
- How are Polkadot-native tokens (DOT/KSM) displayed vs ERC-20 tokens? (Answer: Native currency is defined in network config with 18 decimals for EVM compatibility; token handling follows EVM standards)
- How does DOT's 18-decimal representation work? (Answer: For EVM compatibility, Polkadot Hub exposes DOT with 18 decimals instead of 10, aligning with Ethereum tooling conventions)

## Requirements _(mandatory)_

### Functional Requirements

#### adapter-polkadot Package

- **FR-001**: The system MUST create a new adapter package `packages/adapter-polkadot` that implements the `ContractAdapter` interface
- **FR-002**: The adapter MUST import and use `adapter-evm-core` for all EVM-compatible operations (ABI loading, type mapping, query handling, transaction formatting)

#### Network Configurations (Priority Order)

- **FR-003**: The adapter MUST define P1 network configurations for:
  - **Polkadot Hub** (chain ID: 420420419, currency: DOT, explorer: Blockscout via Etherscan V1 API)
  - **Kusama Hub** (chain ID: 420420418, currency: KSM, explorer: Blockscout via Etherscan V1 API)
  - **Polkadot Hub TestNet** (chain ID: 420420417, currency: PAS, explorer: Blockscout via Etherscan V1 API)
- **FR-004**: The adapter MUST define P2 network configurations for:
  - **Moonbeam Mainnet** (chain ID: 1284, currency: GLMR, explorer: Moonscan/Etherscan V2)
  - **Moonriver Mainnet** (chain ID: 1285, currency: MOVR, explorer: Moonscan/Etherscan V2)
  - **Moonbase Alpha** (chain ID: 1287, currency: DEV, explorer: Moonscan/Etherscan V2)
- **FR-005**: Hub networks MUST use Blockscout API URL with `supportsEtherscanV2: false` (uses V1 API); Moonbeam networks MUST use Etherscan V2 API via `apiUrl` + `supportsEtherscanV2: true`

#### Ecosystem & UI Integration

- **FR-006**: The adapter MUST register "Polkadot" as a distinct ecosystem in the ecosystem manager
- **FR-007**: Networks MUST be ordered with Hub networks first (P1), then parachains (P2) in the network selector
- **FR-008**: The adapter MUST support wallet connections using standard EVM wallets (MetaMask, WalletConnect) configured for parachain networks

#### Execution & Export

- **FR-009**: The adapter MUST support the standard execution strategies (EOA, Relayer) via the core modules
- **FR-010**: The adapter MUST export a `vite-config.ts` following the standardized pattern (returning minimal config since no WASM requirements for EVM mode)
- **FR-011**: The adapter MUST support exported applications that work standalone with Polkadot EVM networks
- **FR-012**: The adapter MUST bundle `adapter-evm-core` using tsup's `noExternal` configuration (same pattern as `adapter-evm`)

#### Architecture & Extensibility

- **FR-013**: The adapter architecture MUST allow for future addition of non-EVM parachain handlers without breaking changes to the public API
- **FR-014**: Network configurations MUST include `executionType` field to distinguish EVM networks from future Substrate networks
- **FR-015**: The network config type MUST be `TypedPolkadotNetworkConfig` extending `TypedEvmNetworkConfig` with Polkadot-specific fields

### Key Entities

- **`adapter-polkadot`**: The main adapter package representing the Polkadot ecosystem, initially supporting EVM networks
- **`PolkadotAdapter`**: The adapter class implementing `ContractAdapter`, which delegates EVM operations to core modules
- **`TypedPolkadotNetworkConfig`**: Extended network configuration type including:
  - `executionType: 'evm' | 'substrate'` - for future routing (only 'evm' implemented initially)
  - `networkCategory: 'hub' | 'parachain'` - for UI grouping
  - Inherits all fields from `TypedEvmNetworkConfig`
- **Hub Networks**: Official Polkadot/Kusama system chains (Polkadot Hub, Kusama Hub, Polkadot Hub TestNet) - use Blockscout (Etherscan V1 compatible)
- **Parachain Networks**: Independent parachains (Moonbeam, Moonriver, Moonbase Alpha) - use Moonscan (Etherscan V2)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can load and interact with contracts on Polkadot Hub and Kusama Hub using Blockscout (Etherscan V1 API) for ABI loading
- **SC-002**: Users can load and interact with contracts on Moonbeam/Moonriver using Moonscan (Etherscan V2) for ABI loading
- **SC-003**: Polkadot appears as a distinct ecosystem in the UI Builder with Hub networks listed before parachain networks
- **SC-004**: Exported applications for Polkadot EVM contracts function correctly as standalone apps
- **SC-005**: The adapter package bundle size MUST be within 25% of `adapter-evm` size (accounting for bundled core); verify with `du -sh dist/` after build
- **SC-006**: All EVM adapter test patterns pass when adapted for Polkadot networks (address validation, type mapping, transaction formatting)
- **SC-007**: Adding a new EVM network requires only adding a network configuration file (no adapter code changes)

## Assumptions

- The Polkadot adapter follows the existing adapter architecture patterns documented in `docs/ADAPTER_ARCHITECTURE.md`
- Polkadot Hub and Kusama Hub use Blockscout explorers with Etherscan V1 API format for contract verification (no changes to `adapter-evm-core` needed)
- Moonbeam/Moonriver use Moonscan which is Etherscan V2 API compatible
- Standard EVM wallets (MetaMask, WalletConnect) can be configured to connect to Polkadot networks
- **Wagmi v2 is used** (same as `adapter-evm`) - the chain configuration format is identical in v2 and v3
- **RainbowKit v2 is available** for wallet connection UI (no dependency on Wagmi v3 upgrade)
- The `adapter-evm-core` package provides all necessary EVM functionality and is stable
- Non-EVM parachain support (Substrate/Wasm) is explicitly out of scope for this feature but should not be precluded by architectural decisions
- Network RPC endpoints and explorer APIs are publicly available for supported networks
- Polkadot Hub exposes DOT with 18 decimals (instead of native 10) for EVM compatibility
- **viem built-in chains**: Moonbeam, Moonriver, Moonbase Alpha are in viem; Polkadot Hub networks require custom definitions (same format works in v2 and v3)

---

## Architecture Breakdown

This section details exactly what changes are needed.

### No Changes to `adapter-evm-core`

Blockscout supports the Etherscan V1 API format (`?module=contract&action=getabi&address=...`), which means we can use the existing `loadAbiFromEtherscanV1` function from `adapter-evm-core` without any modifications.

The key insight is that Blockscout returns the same response format as Etherscan V1:

```json
{
  "status": "1",
  "message": "OK",
  "result": "[{...ABI JSON...}]"
}
```

### New Package: `adapter-polkadot`

#### Package Structure

```
packages/adapter-polkadot/
├── package.json
├── tsconfig.json
├── tsup.config.ts                 # Bundle adapter-evm-core internally
├── vite-config.ts                 # Minimal config (no WASM for EVM mode)
├── src/
│   ├── index.ts                   # Main exports
│   ├── adapter.ts                 # PolkadotAdapter class (orchestrator)
│   ├── types.ts                   # TypedPolkadotNetworkConfig
│   ├── config.ts                  # Adapter configuration
│   ├── networks/
│   │   ├── index.ts               # Aggregate exports
│   │   ├── mainnet.ts             # Polkadot Hub, Kusama Hub, Moonbeam, Moonriver
│   │   └── testnet.ts             # Polkadot Hub TestNet, Moonbase Alpha
│   ├── evm/                       # EVM module - mirrors adapter-evm structure
│   │   ├── index.ts               # Module exports
│   │   ├── abi/                   # ABI loading (delegates to core)
│   │   ├── configuration/         # RPC/Explorer config
│   │   ├── mapping/               # Type mapping
│   │   ├── query/                 # View function queries
│   │   ├── transaction/           # EOA, Relayer, sign-and-broadcast
│   │   ├── transform/             # Input/output formatting
│   │   ├── ui/                    # Network service forms
│   │   ├── utils/                 # Utilities
│   │   └── validation/            # Config validation
│   ├── wallet/
│   │   ├── implementation.ts      # PolkadotWalletImplementation
│   │   ├── hooks/                 # Wagmi hook facades
│   │   ├── utils/                 # Wallet utilities
│   │   └── rainbowkit/            # RainbowKit integration
│   └── __tests__/
│       ├── adapter.test.ts
│       └── networks.test.ts
```

**Architecture Note**: The `evm/` module mirrors the `adapter-evm/src/` structure.
This ensures 1:1 parity and makes it easy to maintain both adapters.
The adapter.ts orchestrates calls using `import * as evm from './evm'` namespace.

**Substrate Extension**: When adding Substrate support, create a parallel `substrate/`
module with the same pattern. The adapter will route based on `executionType`.

#### Key Type Definitions

```typescript
// packages/adapter-polkadot/src/types.ts

import type { TypedEvmNetworkConfig } from '@openzeppelin/ui-builder-adapter-evm-core';

/**
 * Polkadot network execution types.
 * 'evm' - Networks using EVM via PolkaVM/REVM or native EVM (Moonbeam)
 * 'substrate' - Future: Native Substrate/Wasm chains
 */
export type PolkadotExecutionType = 'evm' | 'substrate';

/**
 * Extended network config for Polkadot ecosystem.
 * Inherits all EVM fields for EVM-compatible networks.
 */
export interface TypedPolkadotNetworkConfig extends TypedEvmNetworkConfig {
  /** Execution type determines which handler processes requests */
  executionType: PolkadotExecutionType;

  /** Network category for UI grouping */
  networkCategory: 'hub' | 'parachain';

  /** Optional: Polkadot/Kusama relay chain this network is connected to */
  relayChain?: 'polkadot' | 'kusama';
}
```

#### Network Configuration Examples

```typescript
// packages/adapter-polkadot/src/networks/mainnet.ts

export const polkadotHubMainnet: TypedPolkadotNetworkConfig = {
  id: 'polkadot-hub',
  name: 'Polkadot Hub',
  chainId: 420420419,
  rpcUrl: 'https://services.polkadothub-rpc.com',
  explorerUrl: 'https://blockscout.polkadot.io',
  apiUrl: 'https://blockscout.polkadot.io/api', // Blockscout uses Etherscan V1 format
  supportsEtherscanV2: false, // Use V1 API format
  nativeCurrency: {
    name: 'Polkadot',
    symbol: 'DOT',
    decimals: 18, // 18 decimals for EVM compatibility
  },
  executionType: 'evm',
  networkCategory: 'hub',
  relayChain: 'polkadot',
};

export const kusamaHubMainnet: TypedPolkadotNetworkConfig = {
  id: 'kusama-hub',
  name: 'Kusama Hub',
  chainId: 420420418,
  rpcUrl: 'https://kusama-asset-hub-eth-rpc.polkadot.io',
  explorerUrl: 'https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io',
  apiUrl: 'https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io/api', // Blockscout uses Etherscan V1 format
  supportsEtherscanV2: false, // Use V1 API format
  nativeCurrency: {
    name: 'Kusama',
    symbol: 'KSM',
    decimals: 18, // 18 decimals for EVM compatibility
  },
  executionType: 'evm',
  networkCategory: 'hub',
  relayChain: 'kusama',
};

export const moonbeamMainnet: TypedPolkadotNetworkConfig = {
  id: 'moonbeam',
  name: 'Moonbeam',
  chainId: 1284,
  rpcUrl: 'https://rpc.api.moonbeam.network',
  explorerUrl: 'https://moonbeam.moonscan.io',
  apiUrl: 'https://api.etherscan.io/v2/api', // Moonscan uses Etherscan V2 API
  supportsEtherscanV2: true,
  nativeCurrency: {
    name: 'Glimmer',
    symbol: 'GLMR',
    decimals: 18,
  },
  executionType: 'evm',
  networkCategory: 'parachain',
  relayChain: 'polkadot',
};
```

### Provider Fallback Strategy

Uses the existing `adapter-evm-core` fallback logic:

```
supportsEtherscanV2: true   → Etherscan V2 → Sourcify
supportsEtherscanV2: false  → Etherscan V1 → Sourcify
```

This means:

- **Polkadot/Kusama Hub** (`supportsEtherscanV2: false`): Etherscan V1 (via Blockscout) → Sourcify
- **Moonbeam/Moonriver** (`supportsEtherscanV2: true`): Etherscan V2 → Sourcify
