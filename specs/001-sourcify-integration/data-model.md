# Phase 1 Data Model

## Entities

### ContractDefinitionProvider

- id: string (provider key)
- displayName: string
- urlTemplate?: string (provenance link)
- requiresApiKey: boolean
- supportedNetworks: string[]

### ProviderPreference

- networkId: string
- defaultProvider: string
- source: "appConfig" | "ui" | "urlForced"

### DeepLinkParameters

- networkIdentifier: string (e.g., chainId or equivalent)
- contractIdentifier: string (e.g., address or ecosystem‑specific)
- service?: string (provider key)

### AdapterDeepLinkSchema

- required: string[] (keys)
- optional: string[] (keys)
- validate(params): Result

### RouterIntegration

- currentLocation: string
- getParam(name): string | null
- navigate(path): void

## Relationships

- ProviderPreference relates to ContractDefinitionProvider by `defaultProvider`.
- DeepLinkParameters interpreted via AdapterDeepLinkSchema.
- RouterIntegration provides read/write access to params used to hydrate DeepLinkParameters.

## Validation Rules

- contractIdentifier format validated by active adapter.
- networkIdentifier must resolve to a supported network; otherwise prompt user.
- service must be known by adapter; otherwise fallback to adapter default order.

## State Transitions

- On deep link load → set active network, set identifier, optionally set forced service → begin provider sequence.
- On failure with forced service → stop with message. Without force → continue fallback.
