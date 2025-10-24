# Adapter Integration Contract (Midnight v1)

## ContractAdapter Surface (Selected)

- getEcosystemReactUiContextProvider(): provides wallet UI context provider
- getEcosystemReactHooks(): returns facade hooks for account/connect
- getEcosystemWalletComponents(): ConnectButton, AccountDisplay
- getAvailableUiKits(): returns available UI kits (include 'custom' at minimum)
- configureUiKit?(config): optional; allow excluding non‑applicable components (e.g., NetworkSwitcher)
- getUiLabels?(): optional UI label overrides for chain‑specific verbiage
- supportsWalletConnection(): returns true
- getAvailableConnectors(): enumerate supported connectors (e.g., Lace)
- connectWallet()/disconnectWallet()/getWalletConnectionStatus(): wallet lifecycle surface (UI generally uses components/hooks)
- getContractDefinitionInputs(): fields: contractAddress, privateStateId, contractSchema (.d.ts), contractModule (.cjs), witnessCode?
- loadContract(source): returns ContractSchema { name, ecosystem, address, functions, events }
- getWritableFunctions(schema): filter functions that modify state
- mapParameterTypeToFieldType(type): returns default field type
- getCompatibleFieldTypes(type): returns compatible field types
- generateDefaultField(param): creates base form field config
- isViewFunction(fn): true when non-mutating
- queryViewFunction(...): placeholder in v1; parameter‑less auto views are handled by widget flows
- formatFunctionResult(value): produce readable string output
- formatTransactionData(schema, functionId, inputs, fields): build payload for write forms
- signAndBroadcast(payload, executionConfig): wallet‑only in v1; adapt CLI transaction building flow (prepare/balance → prove → submit) behind adapter API
- validateRpcEndpoint/testRpcConnection: network diagnostics
- getSupportedExecutionMethods(): wallet only in v1
- validateExecutionConfig(config): ensure only wallet method accepted in v1
- getExplorerUrl/getExplorerTxUrl: return null (no official explorer yet)
- isValidAddress(address): Bech32m validation expected
- getRelayers?/getRelayer?/getRelayerOptionsComponent?: not required in v1; may return stubs/no‑ops

## UI Builder Expectations

- Renderer uses `ContractStateWidget` to auto-display parameter-less view functions.
- Builder persists contract artifacts and reloads them across steps.
- Exported app must include adapter packages/config and replicate Builder behavior.
  - Sync with `export-manifest.md` and `packages/adapter-midnight/src/config.ts` dependency list (e.g., `@midnight-ntwrk/dapp-connector-api`).

## Error Handling

- Validation errors are user-friendly and localized to fields.

## Non‑Goals (v1)

- Relayer execution, multisig, or external submission flows
- Parameterized view function input UI
- Public explorer deep‑links
