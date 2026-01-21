import type { Ecosystem } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { AdapterConfigLoader } from '../AdapterConfigLoader';

const LOG_SYSTEM = 'File Assembly (copyAdapterPatchFiles)';

/**
 * Pre-load all patch files from adapter packages using Vite's glob import.
 * This is required because Vite needs static analysis of imports at build time.
 *
 * The glob pattern matches all .patch files in any adapter package's patches directory.
 */
const patchModules = import.meta.glob<string>('../../../../packages/adapter-*/patches/*.patch', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * Copies patch files from the adapter package to the exported project.
 *
 * This function reads the patchedDependencies from the adapter config and
 * copies the corresponding patch files to the exported project's patches/ directory.
 *
 * The approach is chain-agnostic: any adapter can specify patches in its config,
 * and this assembler will handle copying them to the exported project.
 *
 * @param projectFiles - The current map of project files to be modified.
 * @param ecosystem - The ecosystem for which to copy patches.
 */
export async function copyAdapterPatchFiles(
  projectFiles: Record<string, string | Uint8Array | Blob>,
  ecosystem: Ecosystem
): Promise<void> {
  const adapterConfigLoader = new AdapterConfigLoader();
  const adapterConfig = await adapterConfigLoader.loadConfig(ecosystem);

  if (!adapterConfig?.patchedDependencies) {
    logger.debug(LOG_SYSTEM, `No patched dependencies for ecosystem: ${ecosystem}`);
    return;
  }

  const patchedDeps = adapterConfig.patchedDependencies;
  const patchFileNames = Object.values(patchedDeps);

  if (patchFileNames.length === 0) {
    logger.debug(LOG_SYSTEM, `No patch files to copy for ecosystem: ${ecosystem}`);
    return;
  }

  logger.info(LOG_SYSTEM, `Copying ${patchFileNames.length} patch file(s) for ${ecosystem}`);

  for (const patchFileName of patchFileNames) {
    const patchContent = findPatchContent(patchFileName);

    if (patchContent) {
      const destPath = `patches/${patchFileName}`;
      projectFiles[destPath] = patchContent;
      logger.debug(LOG_SYSTEM, `Copied patch file: ${destPath}`);
    } else {
      logger.warn(LOG_SYSTEM, `Patch file not found: ${patchFileName}`);
    }
  }
}

/**
 * Finds patch content from the pre-loaded patch modules.
 *
 * @param patchFileName - The patch file name (e.g., '@midnight-ntwrk__compact-runtime@0.9.0.patch')
 * @returns The patch file content as a string, or null if not found
 */
function findPatchContent(patchFileName: string): string | null {
  // Search through pre-loaded patch modules for the matching file
  for (const [path, content] of Object.entries(patchModules)) {
    if (path.endsWith(`/${patchFileName}`)) {
      return content;
    }
  }
  return null;
}
