import { logger } from '@openzeppelin/transaction-form-renderer';

import type { ExportOptions } from '../../core/types/ExportTypes';

/**
 * Applies CLI target-specific modifications, currently focused on CSS adjustments.
 *
 * @param projectFiles - The current map of project files to be modified.
 * @param exportOptions - Export customization options.
 */
export async function applyCliTargetModifications(
  projectFiles: Record<string, string>,
  exportOptions: ExportOptions
): Promise<void> {
  const logSystem = 'File Assembly (applyCliTargetModifications)';
  const mainCssPath = 'src/styles.css';

  if (exportOptions.isCliBuildTarget && projectFiles[mainCssPath]) {
    logger.info(logSystem, `Modifying ${mainCssPath} for CLI target...`);
    const originalCssContent = projectFiles[mainCssPath];
    const modifiedCssContent = originalCssContent.replace(
      /^\s*@import\s+['"]tailwindcss['"]\s*;?/m,
      "@import 'tailwindcss' source('../../../');" // Adjusted for potential subdirectory depth
    );
    if (modifiedCssContent !== originalCssContent) {
      projectFiles[mainCssPath] = modifiedCssContent;
      logger.info(logSystem, `${mainCssPath} updated with @source directive.`);
    } else {
      logger.warn(
        logSystem,
        `Could not find standard @import "tailwindcss"; line at start of ${mainCssPath} to modify.`
      );
    }
  } else if (exportOptions.isCliBuildTarget && !projectFiles[mainCssPath]) {
    logger.warn(
      logSystem,
      `${mainCssPath} not found. Cannot apply CLI target modifications for CSS.`
    );
  }
}
