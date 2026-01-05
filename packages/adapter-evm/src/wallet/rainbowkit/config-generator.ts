import { UiKitConfiguration } from '@openzeppelin/ui-types';

/**
 * Generates the content for a `rainbowkit.config.ts` file for an exported project.
 * It merges the user-provided configuration with the necessary boilerplate to ensure
 * the config is valid for RainbowKit's `getDefaultConfig`.
 *
 * @param userConfig - The user-provided configuration from the builder app.
 * @returns A string containing the formatted TypeScript code for the config file.
 */
export function generateRainbowKitConfigFile(userConfig: UiKitConfiguration['kitConfig']): string {
  const config = (userConfig || {}) as Record<string, unknown>;
  const appName = (config.appName as string) || 'My RainbowKit App';
  const learnMoreUrl = (config.learnMoreUrl as string) || 'https://openzeppelin.com';
  // We provide a default projectId as it's required by RainbowKit for WalletConnect.
  const projectId = (config.projectId as string) || 'YOUR_PROJECT_ID';

  // Build the appInfo part conditionally
  const appInfoLines = [`appName: '${appName}'`];
  if (learnMoreUrl) {
    appInfoLines.push(`learnMoreUrl: '${learnMoreUrl}'`);
  }
  const appInfoContent = appInfoLines.join(',\n      ');

  const fileContent = `// RainbowKit configuration for your exported application
// This file is used ONLY in the exported app, not in the builder app preview

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
