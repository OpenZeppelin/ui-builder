# Phase 1 Data Model

## Entities

### ContractDefinitionProvider (Adapter-Declared)

- key: ProviderKey (typed union per adapter; e.g., EVM: 'etherscan' | 'sourcify'; Stellar: 'sdk')
- displayName: string
- provenanceUrlTemplate?: string (link to provider page)
- requiresApiKey?: boolean
- supportsNetwork?: (network: NetworkConfig) => boolean  
  (Derive support from a single source of truth in `NetworkConfig`, e.g., EVM `supportsEtherscanV2`, `primaryExplorerApiIdentifier`, `ecosystem === 'evm'`).

Note: For EVM explorer-backed providers, API keys/URLs reuse existing `UserExplorerConfig` via `UserExplorerConfigService` and `AppConfigService`. No new config types are introduced.

### ProviderPreference (Resolved)

- networkId: NetworkConfig['id']
- effectiveProvider: ProviderKey (typed union per adapter)
- source: 'appConfig' | 'ui' | 'urlForced'

Note: This is a computed state derived from:

- Global/app config (`AppConfigService`)
- User Explorer settings (`UserExplorerConfigService`)
- URL `service` param (forced)

### DeepLinkParameters (Adapter-Interpreted)

- ecosystem: string (required; e.g., `evm`, `stellar`, `solana`, `midnight`)
- networkIdentifier: string (e.g., `networkId` or `chainId`; adapter interprets)
- contractIdentifier: string (e.g., address/contract ID; adapter validates)
- service?: ProviderKey (typed union per adapter)

### AdapterDeepLinkSchema (No New Base Types)

- required: readonly string[] (keys)
- optional: readonly string[] (keys)
- validate(params): Result

Note: Each adapter defines its own schema and validation using existing adapter surfaces (`getContractDefinitionInputs` for field names and adapter-specific validation like `isValidAddress`). No new base interface methods are introduced.

### RouterIntegration

- currentLocation: string
- getParam(name): string | null
- navigate(path): void

Note: Implemented via a lightweight RouterService wrapper in `@openzeppelin/ui-builder-utils`. No routing logic in adapters.

## Relationships

- ProviderPreference is resolved against the adapter-declared ContractDefinitionProvider list.
- EVM: provider config (API URL/key) resolved via existing `resolveExplorerConfig()` and user/app config services; Sourcify requires no keys.
- DeepLinkParameters map to form field names returned by `getContractDefinitionInputs()` (e.g., `contractAddress`).

## Validation Rules

- contractIdentifier validated by `adapter.isValidAddress(address, addressType?)` (or equivalent per adapter).
- networkIdentifier must resolve to a supported network; otherwise prompt the user.
- service must match an adapter-declared ProviderKey; otherwise fall back to adapter default order.

## State Transitions

- On deep link load → set active network, set identifier, optionally set forced service → begin provider sequence.
- On failure with forced service → stop with message. Without force → continue fallback.

## Ecosystem Notes

- EVM: Primary provider uses existing Etherscan logic (`etherscan.ts`, `etherscan-v2.ts`) with `resolveExplorerConfig`; fallback provider is Sourcify (no API key). Use existing `shouldUseV2Api()` to branch V1/V2.
- Stellar: Primary provider uses official Stellar SDK (network RPC) to derive the contract definition; explorer URLs are for provenance links only. No additional providers are introduced at this time.

## Typing Guidelines

- Avoid untyped strings for keys and identifiers that span modules. Prefer:
  - ProviderKey unions per adapter (exported from adapter types).
  - `type NetworkId = NetworkConfig['id']` for cross-package safety.
  - Literal unions over enums unless interop with external serialized values is required.
