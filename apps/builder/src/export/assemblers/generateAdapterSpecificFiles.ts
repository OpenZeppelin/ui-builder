import { logger } from '@openzeppelin/ui-utils';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

import type { BuilderFormConfig } from '../../core/types/FormTypes';

/**
 * Generates and adds adapter-specific files (e.g., UI kit configs) to the project.
 *
 * @param projectFiles - The current map of project files to be modified.
 * @param runtime - The active BuilderRuntime instance.
 * @param formConfig - The form configuration, containing the uiKitConfig.
 */
export async function generateAdapterSpecificFiles(
  projectFiles: Record<string, string | Uint8Array | Blob>,
  runtime: BuilderRuntime,
  formConfig: BuilderFormConfig
): Promise<void> {
  const logSystem = 'File Assembly (generateAdapterSpecificFiles)';

  if (typeof runtime.uiKit.getExportableWalletConfigFiles !== 'function') {
    logger.info(logSystem, 'Runtime does not support exporting wallet config files. Skipping.');
    return;
  }

  try {
    const walletConfigFiles = await runtime.uiKit.getExportableWalletConfigFiles(
      formConfig.uiKitConfig
    );

    if (Object.keys(walletConfigFiles).length > 0) {
      logger.info(
        logSystem,
        `Adding ${Object.keys(walletConfigFiles).length} wallet config file(s) from runtime.`
      );
      Object.assign(projectFiles, walletConfigFiles);
    }
  } catch (error) {
    logger.error(logSystem, 'Error generating adapter-specific wallet config files:', error);
  }
}
