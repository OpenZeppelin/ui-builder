import type { UiKitConfiguration } from '@openzeppelin/ui-builder-types';

import { generateStellarWalletsKitConfigFile } from './config-generator';

/**
 * Generates the specific configuration file for Stellar Wallets Kit during project export.
 *
 * @param uiKitConfig The full UI kit configuration object from the builder.
 * @returns A record containing the file path and its generated content.
 */
export function generateStellarWalletsKitExportables(
  uiKitConfig: UiKitConfiguration
): Record<string, string> {
  const filePath = 'src/config/wallet/stellar-wallets-kit.config.ts';
  const content =
    uiKitConfig.customCode || generateStellarWalletsKitConfigFile(uiKitConfig.kitConfig);

  return { [filePath]: content };
}
