import type { UiKitConfiguration } from '@openzeppelin/ui-types';

/**
 * Generates the content for a `stellar-wallets-kit.config.ts` file for an exported project.
 * This creates a configuration wrapper that can be used to initialize the Stellar Wallets Kit.
 *
 * @param userConfig - The user-provided configuration from the builder app.
 * @returns A string containing the formatted TypeScript code for the config file.
 */
export function generateStellarWalletsKitConfigFile(
  userConfig: UiKitConfiguration['kitConfig']
): string {
  const config = (userConfig || {}) as Record<string, unknown>;

  // Extract user-provided configuration options
  const appName = (config.appName as string) || 'My Stellar App';
  const network = (config.network as string) || 'TESTNET';
  const walletConnectProjectId = (config.walletConnectProjectId as string) || '';
  const modalTitle = (config.modalTitle as string) || `Connect to ${appName}`;
  const buttonText = (config.buttonText as string) || 'Connect Wallet';

  const fileContent = `// Stellar Wallets Kit configuration for your exported application
// This file is used ONLY in the exported app, not in the builder app preview

import { 
  StellarWalletsKit, 
  WalletNetwork, 
  allowAllModules
} from '@creit.tech/stellar-wallets-kit';

/**
 * Stellar Wallets Kit configuration wrapper
 * 
 * The kit supports multiple wallets including:
 * - Freighter
 * - xBull  
 * - Ledger
 * - Trezor
 * - WalletConnect
 * - And more...
 */
export const stellarWalletsKitConfig = {
  // App information
  appName: '${appName}',
  
  // Network configuration (TESTNET or PUBLIC/MAINNET)
  network: WalletNetwork.${network === 'MAINNET' || network === 'PUBLIC' ? 'PUBLIC' : 'TESTNET'},
  
  // UI customization
  buttonText: '${buttonText}',
  modalTitle: '${modalTitle}',
  
  // WalletConnect configuration
  ${walletConnectProjectId ? `walletConnectProjectId: '${walletConnectProjectId}',` : "// walletConnectProjectId: 'YOUR_PROJECT_ID', // Get yours at https://cloud.walletconnect.com"}
};

/**
 * Creates and configures a StellarWalletsKit instance
 * @returns Configured StellarWalletsKit instance
 */
export function createStellarWalletsKit(): StellarWalletsKit {
  const modules = [
    ...allowAllModules()
  ];

  return new StellarWalletsKit({
    network: stellarWalletsKitConfig.network,
    modules,
  });
}

export default stellarWalletsKitConfig;`;

  return fileContent;
}
