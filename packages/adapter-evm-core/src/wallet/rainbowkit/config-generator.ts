/**
 * RainbowKit Configuration Generator
 *
 * Generates the content for a `rainbowkit.config.ts` file for exported projects.
 * Shared by all EVM-compatible adapters (EVM, Polkadot parachains, etc.).
 */

import type { UiKitConfiguration } from '@openzeppelin/ui-types';

export interface RainbowKitConfigOptions {
  /** Default app name if not provided in config */
  defaultAppName?: string;
  /** Header comment for the generated file */
  headerComment?: string;
}

const DEFAULT_OPTIONS: RainbowKitConfigOptions = {
  defaultAppName: 'My RainbowKit App',
  headerComment: `// RainbowKit configuration for your exported application
// This file is used ONLY in the exported app, not in the builder app preview`,
};

/**
 * Generates the content for a `rainbowkit.config.ts` file for an exported project.
 * It merges the user-provided configuration with the necessary boilerplate to ensure
 * the config is valid for RainbowKit's `getDefaultConfig`.
 *
 * @param userConfig - The user-provided configuration from the builder app.
 * @param options - Optional customization for the generated file.
 * @returns A string containing the formatted TypeScript code for the config file.
 */
export function generateRainbowKitConfigFile(
  userConfig: UiKitConfiguration['kitConfig'],
  options: RainbowKitConfigOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const config = (userConfig || {}) as Record<string, unknown>;
  const appName = (config.appName as string) || opts.defaultAppName;
  const learnMoreUrl = (config.learnMoreUrl as string) || 'https://openzeppelin.com';
  // We provide a default projectId as it's required by RainbowKit for WalletConnect.
  const projectId = (config.projectId as string) || 'YOUR_PROJECT_ID';

  // Build the appInfo part conditionally
  const appInfoLines = [`appName: '${appName}'`];
  if (learnMoreUrl) {
    appInfoLines.push(`learnMoreUrl: '${learnMoreUrl}'`);
  }
  const appInfoContent = appInfoLines.join(',\n      ');

  const fileContent = `${opts.headerComment}

// Uncomment imports as needed:
// import { darkTheme, lightTheme } from '@rainbow-me/rainbowkit';

const rainbowKitAppConfig = {
  wagmiParams: {
    appName: '${appName}',
    projectId: '${projectId}', // Get yours at https://cloud.walletconnect.com
    
    // Additional options:
    // ssr: true,
    // wallets: [...],
  },
  providerProps: {
    appInfo: {
      ${appInfoContent}
    },
    
    // UI customization - all features work in exported apps:
    // theme: darkTheme(),
    // modalSize: 'compact',
    // showRecentTransactions: true,
    // coolMode: true,
  },
};

export default rainbowKitAppConfig;`;

  return fileContent;
}

/**
 * Generates the specific configuration file for RainbowKit during project export.
 *
 * @param uiKitConfig The full UI kit configuration object from the builder.
 * @param options - Optional customization for the generated file.
 * @returns A record containing the file path and its generated content.
 */
export function generateRainbowKitExportables(
  uiKitConfig: UiKitConfiguration,
  options: RainbowKitConfigOptions = {}
): Record<string, string> {
  const filePath = 'src/config/wallet/rainbowkit.config.ts';
  const content =
    uiKitConfig.customCode || generateRainbowKitConfigFile(uiKitConfig.kitConfig, options);

  return { [filePath]: content };
}
