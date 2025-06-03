// packages/core/src/config/wallet/rainbowkit.config.ts
import { type RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';

// For WalletConnect project ID, appName, wallets, ssr options for getDefaultConfig
// RainbowKit doesn't export a single neat type for all getDefaultConfig options other than `chains` and `transports`.
// Users can refer to RainbowKit docs for available options for getDefaultConfig.
// For providerProps, we can infer the type.

// Import specific themes or chain objects if you plan to use them directly here
// import { mainnet } from 'viem/chains';
// import { darkTheme } from '@rainbow-me/rainbowkit';

/**
 * User-defined native configuration for RainbowKit.
 * This object will be dynamically loaded by the EvmAdapter when 'rainbowkit' is selected.
 * It should export a default object containing:
 *  - `wagmiParams`: An object with parameters for RainbowKit's `getDefaultConfig()`
 *                   (e.g., `appName`, `projectId`, `wallets`, `ssr`).
 *                   The adapter will override `chains` and `transports`.
 *  - `providerProps`: An object with props for the `<RainbowKitProvider />` component
 *                     (e.g., `theme`, `locale`, `modalSize`, `initialChain`, `appInfo`).
 */

// Infer props type from RainbowKitProvider for stronger typing on the user's side for providerProps.
type InferredRainbowKitProviderProps = React.ComponentProps<typeof RainbowKitProvider>;

const rainbowKitAppConfig = {
  wagmiParams: {
    appName: 'Transaction Form Builder (Core Dev)',
    projectId: '9f7100fc84f2327968f7bb11d38a4c2b', // <<< WALLETCONNECT PROJECT ID
    // Example for custom wallet list (users should import types like `WalletList` or `Wallet` from RK if they use this)
    // wallets: [
    //   {
    //     groupName: 'Popular',
    //     wallets: [injectedWallet, metaMaskWallet, walletConnectWallet], // these would need to be imported
    //   },
    // ],
    ssr: false,
  },
  providerProps: {
    theme: darkTheme(), // Example: uncomment and import darkTheme
    // initialChain: mainnet, // Example: uncomment and import mainnet from viem/chains
    modalSize: 'compact',
    showRecentTransactions: true,
    coolMode: true,
    appInfo: {
      appName: 'Transaction Form Builder',
      learnMoreUrl: 'https://openzeppelin.com',
    },
  } as Partial<InferredRainbowKitProviderProps>, // User can cast or ensure their object matches
};

export default rainbowKitAppConfig;
