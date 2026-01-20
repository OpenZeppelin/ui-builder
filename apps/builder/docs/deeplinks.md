## Deep Link Guide

This guide explains how deep links work in the UI Builder and provides copy‑pasteable examples. Deep links let you prefill the network and contract identifier, and optionally force a specific contract definition provider (e.g., Etherscan or Sourcify).

### Behavior

- The builder reads query parameters on first load, prepares the correct network/adapter, and preloads the contract definition when possible.
- To prevent unintended reloads when navigating elsewhere, the URL is cleared immediately after the parameters are consumed.
- Provider precedence: URL forced service → User default (saved) → App default → Adapter default.

### Parameters

- `ecosystem` (required): Target ecosystem, e.g., `evm`, `stellar`, `solana`, `midnight`.
- `networkId` | `networkid`: Network configuration ID (adapter-defined), for example `ethereum-sepolia`.
- `chainId` (adapter-specific): Numeric chain identifier (commonly used by EVM). If provided without `networkId`, the builder resolves the network by `chainId` within the selected `ecosystem`.
- `address` | `contractAddress` | `identifier`: Contract identifier. For EVM, this is the contract address.
- `service` (optional): Forces a specific contract definition provider. Supported values today: `etherscan`, `sourcify`.

Notes:

- Aliases are accepted to keep links flexible across external sources (e.g., docs, message threads, tooling). If multiple synonyms are present, the last value wins (per `URLSearchParams`).
- Invalid or unsupported values are ignored; the builder falls back to defaults and surfaces a helpful error if loading fails. If `service` is unsupported for the selected ecosystem/network, the builder informs you and falls back to the default provider order.

### Examples (EVM Sepolia)

Address used below: `0x753E2CFc06cF3bD485B846238828a9DA543BFF41`

Canonical minimal

```text
?ecosystem=evm&networkId=ethereum-sepolia&address=0x753E2CFc06cF3bD485B846238828a9DA543BFF41
```

Field alias variants

```text
?ecosystem=evm&networkId=ethereum-sepolia&contractAddress=0x753E2CFc06cF3bD485B846238828a9DA543BFF41
?ecosystem=evm&networkId=ethereum-sepolia&identifier=0x753E2CFc06cF3bD485B846238828a9DA543BFF41
?ecosystem=evm&networkid=ethereum-sepolia&address=0x753E2CFc06cF3bD485B846238828a9DA543BFF41
```

Force provider

```text
?ecosystem=evm&networkId=ethereum-sepolia&address=0x753E2CFc06cF3bD485B846238828a9DA543BFF41&service=etherscan
?ecosystem=evm&networkId=ethereum-sepolia&address=0x753E2CFc06cF3bD485B846238828a9DA543BFF41&service=sourcify
```

### Examples (EVM Mainnet by chainId)

```text
?ecosystem=evm&chainId=1&address=0xdAC17F958D2ee523a2206206994597C13D831ec7
?ecosystem=evm&chainId=1&address=0xdAC17F958D2ee523a2206206994597C13D831ec7&service=etherscan
?ecosystem=evm&chainId=1&contractAddress=0xdAC17F958D2ee523a2206206994597C13D831ec7&service=sourcify
```

Mixing aliases + forced provider

```text
?ecosystem=evm&networkid=ethereum-sepolia&contractAddress=0x753E2CFc06cF3bD485B846238828a9DA543BFF41&service=etherscan
?ecosystem=evm&networkId=ethereum-sepolia&identifier=0x753E2CFc06cF3bD485B846238828a9DA543BFF41&service=sourcify
```

### Examples (Ecosystem-Only)

Pre-select an ecosystem without specifying a network or contract. The user will land on the chain selection step with the ecosystem already selected, then manually choose a network.

```text
# EVM ecosystem only
?ecosystem=evm

# Stellar ecosystem only
?ecosystem=stellar

# Solana ecosystem only
?ecosystem=solana

# Midnight ecosystem only
?ecosystem=midnight
```

**Use case:** Perfect for redirecting users from external tools (e.g., Wizard "Builder UI" button) to the UI Builder with a pre-selected blockchain ecosystem.

Edge cases (for testing)

```text
# Unknown provider → fallback to defaults
?ecosystem=evm&networkId=ethereum-sepolia&address=0x753E2CFc06cF3bD485B846238828a9DA543BFF41&service=unknown

# Missing network → should not auto-load; expect UI prompt
?ecosystem=evm&address=0x753E2CFc06cF3bD485B846238828a9DA543BFF41

# Missing address → pre-selects ecosystem and network, user provides address manually
?ecosystem=evm&networkId=ethereum-sepolia

# Unknown chainId (EVM) → shows message and prompts selection
?ecosystem=evm&chainId=999999&address=0x753E2CFc06cF3bD485B846238828a9DA543BFF41

# Lowercase address (adapter will normalize/check)
?ecosystem=evm&networkId=ethereum-sepolia&address=0x753e2cfc06cf3bd485b846238828a9da543bff41

# Duplicate keys → last value wins
?ecosystem=evm&networkId=ethereum-sepolia&networkId=ethereum-sepolia&address=0x753E2CFc06cF3bD485B846238828a9DA543BFF41
```

### Provider notes: Sourcify (EVM)

- **API**: Sourcify is now queried via their API v2 endpoint (`https://sourcify.dev/server/v2/contract/<chainId>/<address>?fields=abi,metadata`). The response already includes the ABI, so no repository fallback is needed.
- **Viewer page**: [Sourcify contract status (USDT)](https://repo.sourcify.dev/1/0xdac17f958d2ee523a2206206994597c13d831ec7)

### Tips

- If you need to test UI default vs. forced provider precedence, first set your default provider in `Network Settings → Contract Definitions`, then use a deep link with `service=...` to override it temporarily.
