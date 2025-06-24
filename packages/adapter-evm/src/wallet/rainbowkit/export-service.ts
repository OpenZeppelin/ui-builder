import type { UiKitConfiguration } from '@openzeppelin/transaction-form-types';

import { generateRainbowKitConfigFile } from './config-generator';

/**
 * Generates the specific configuration file for RainbowKit during project export.
 *
 * @param uiKitConfig The full UI kit configuration object from the builder.
 * @returns A record containing the file path and its generated content.
 */
export function generateRainbowKitExportables(
  uiKitConfig: UiKitConfiguration
): Record<string, string> {
  const filePath = 'src/config/wallet/rainbowkit.config.ts';
  const content = generateRainbowKitConfigFile(uiKitConfig.kitConfig);
  return { [filePath]: content };
}
