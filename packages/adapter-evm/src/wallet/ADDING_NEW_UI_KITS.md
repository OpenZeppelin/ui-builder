# Adding New UI Kits to `EvmAdapter`

The `EvmAdapter`'s wallet module is designed to be extensible, allowing support for various third-party UI kits built on top of Wagmi. The integration of RainbowKit serves as the primary example and pattern. This guide outlines the steps to add support for a new UI kit (referred to as "YourNewKit" in examples).

## Prerequisites

- Familiarity with the existing `EvmAdapter` architecture, particularly `EvmUiKitManager`, `EvmWalletUiRoot`, `WagmiWalletImplementation`, and the configuration flow.
- Understanding of how RainbowKit is currently integrated (`packages/adapter-evm/src/wallet/rainbowkit/`).

## Steps to Add "YourNewKit"

1.  **Define Kit Name in Types**:

    - In `packages/types/src/adapters/ui-enhancements.ts`, add your kit's unique identifier string (e.g., `'yournewkit'`) to the `UiKitConfiguration['kitName']` literal union type.
      ```typescript
      export interface UiKitConfiguration {
        kitName?: 'rainbowkit' | 'custom' | 'none' | 'yournewkit'; // Add your new kit name
        // ... rest of the interface
      }
      ```

2.  **Create Kit-Specific Directory**:

    - Create a new directory for your kit's modules within the EVM adapter: `packages/adapter-evm/src/wallet/yournewkit/`.

3.  **Implement an Asset Manager (`yournewkitAssetManager.ts`)**:

    - Create `packages/adapter-evm/src/wallet/yournewkit/yournewkitAssetManager.ts`.
    - Export an `async` function, e.g., `ensureYourNewKitAssetsLoaded(): Promise<KitAssets>`.
    - The `KitAssets` interface (can be defined locally or a shared one if suitable) should be: `{ ProviderComponent: React.ComponentType<React.PropsWithChildren<unknown>> | null, assetsReady: boolean }`.
    - This function must dynamically import the main provider component from "YourNewKit" library and any necessary CSS files (e.g., `import('yournewkit-package')`, `import('yournewkit-package/styles.css')`).
    - It should manage its own internal module-level state/promises to ensure these assets are loaded only _once_ per application lifecycle.
    - It should return the loaded provider component and a boolean indicating if all critical assets (like CSS) were successfully loaded.
    - Refer to `packages/adapter-evm/src/wallet/rainbowkit/rainbowkitAssetManager.ts` for an example.

4.  **Implement Kit-Specific `WagmiConfig` Service (e.g., `yournewkit/config-service.ts`)** (If Needed):

    - This step is necessary if "YourNewKit" has its own helper function (like RainbowKit's `getDefaultConfig`) for creating a `WagmiConfig`, or if it requires a `WagmiConfig` with specific connectors or setup different from the adapter's default.
    - If "YourNewKit" can work with a standard `WagmiConfig` (created by `WagmiWalletImplementation.createDefaultConfig()`), this specific service might not be strictly necessary for `WagmiConfig` creation, but could still be useful for validating kit-specific parameters.
    - If creating this service:
      - Create `packages/adapter-evm/src/wallet/yournewkit/config-service.ts`.
      - Implement a function like `async createYourNewKitWagmiConfig(resolvedKitConfig: Record<string, unknown>, chains: readonly Chain[], chainIdToNetworkIdMap: Record<number, string>, getRpcEndpointOverride: Func): Promise<Config | null>`.
        - `resolvedKitConfig` will be the `kitConfig` object from `UiKitConfiguration`, containing user-native settings for "YourNewKit".
        - This function should use these inputs to call the kit's `getDefaultConfig` equivalent or `createConfig` from `@wagmi/core` directly.
        - Implement caching for generated `WagmiConfig` instances (similar to RainbowKit's `configCache`) if appropriate, especially if the config creation is expensive or has side effects like WalletConnect initialization.
      - Export a wrapper like `async getWagmiConfigForYourNewKit(uiKitConfig: UiKitConfiguration, ...): Promise<Config | null>` that `WagmiWalletImplementation` can call.
    - Refer to `packages/adapter-evm/src/wallet/rainbowkit/config-service.ts`.

5.  **Implement Component Factory (e.g., `yournewkit/componentFactory.ts`)**:

    - Create `packages/adapter-evm/src/wallet/yournewkit/componentFactory.ts`.
    - Export a function, e.g., `createYourNewKitComponents(): EcosystemWalletComponents`.
    - This function should dynamically import and return UI components from "YourNewKit" (e.g., its Connect Button, Account Display) mapped to the standard names in the `EcosystemWalletComponents` interface (`ConnectButton`, `AccountDisplay`, `NetworkSwitcher`).
    - Consider creating lazy-loading wrapper components for each exported component (similar to `RainbowKitConnectButton` in `packages/adapter-evm/src/wallet/rainbowkit/components.tsx`) to handle dynamic import, loading/error states, and context readiness for each component individually.

6.  **Update `EvmUiKitManager.configure()`**: (in `packages/adapter-evm/src/wallet/evmUiKitManager.ts`)

    - Add an `else if (newKitName === 'yournewkit') { ... }` block.
    - Inside this block:
      - If assets for "YourNewKit" are not yet loaded in the manager's state (or if `kitChanged` is true), call your new `ensureYourNewKitAssetsLoaded()` from `yournewkitAssetManager.ts`.
      - Update `state.kitProviderComponent` and `state.isKitAssetsLoaded` with the results from the asset loader.
      - Throw an error if critical assets for "YourNewKit" fail to load.
      - Call the new `await evmImpl.getConfigForYourNewKit(newFullUiKitConfig)` method (see next step) to get the `WagmiConfig`.

7.  **Update `WagmiWalletImplementation.ts`**: (in `packages/adapter-evm/src/wallet/implementation/wagmi-implementation.ts`)

    - Add a new public method: `async getConfigForYourNewKit(uiKitConfig: UiKitConfiguration): Promise<Config | null>`. This method will call the service created in Step 4 (e.g., `getWagmiConfigForYourNewKit` from `yournewkit/config-service.ts`) or directly return a default config if "YourNewKit" doesn't require a specialized `WagmiConfig`.
    - Update the `getActiveConfigForManager` method to include an `else if (uiKitConfig?.kitName === 'yournewkit')` case to call `this.getConfigForYourNewKit(...)`.

8.  **Update `uiKitService.ts` (`getResolvedWalletComponents`)**: (in `packages/adapter-evm/src/wallet/utils/uiKitService.ts`)

    - Add an `else if (currentKitName === 'yournewkit') { ... }` block.
    - Inside, if "YourNewKit" has specific parameters in `kitConfig` that need validation (like `wagmiParams` for RainbowKit), call a new `validateYourNewKitConfig(...)` function (which you'd create in `yournewkit/utils.ts` or similar).
    - Call `createYourNewKitComponents()` from your kit's component factory.
    - Pass the result through `filterWalletComponents` along with any exclusions.

9.  **User Documentation & Configuration**:

    - Update `packages/adapter-evm/src/wallet/README.md` to list "YourNewKit" as a supported `kitName`.
    - Provide instructions for users on how to configure "YourNewKit":
      - Setting `kitName: 'yournewkit'` in their `app.config.json` or via programmatic override.
      - Creating the native configuration file `src/config/wallet/yournewkit.config.ts`. Document the expected structure of the default export from this file (e.g., if it needs objects like `kitSpecificParams` or `providerProps`).
      - Listing any required peer dependencies for "YourNewKit" (e.g., `yournewkit-package`, `@tanstack/react-query` if it's a peer dep for that kit).

10. **Testing**: Implement comprehensive unit and integration tests for the new kit's integration, covering configuration loading, asset loading, `WagmiConfig` creation, component rendering, and core functionalities like connect/disconnect and transaction signing.

This pattern aims to keep kit-specific concerns isolated within their respective directories while leveraging the central orchestration provided by `EvmUiKitManager` and `EvmAdapter`. The use of dynamic imports ensures that only the assets for the currently active or configured UI kit are loaded by the browser.
