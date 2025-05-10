import { logger } from '@openzeppelin/transaction-form-renderer';

import type { ExportOptions } from '../../core/types/ExportTypes';
import type { TemplateManager } from '../TemplateManager';

/**
 * Gets base template files from TemplateManager and merges custom generated files.
 *
 * @param templateManager - Instance of TemplateManager.
 * @param exportOptions - Options for exporting.
 * @param customFiles - Record of custom file paths to content (e.g., generated components).
 * @returns A promise that resolves to the initial project files map.
 */
export async function addCoreTemplateFiles(
  templateManager: TemplateManager,
  exportOptions: ExportOptions,
  customFiles: Record<string, string>
): Promise<Record<string, string>> {
  logger.info(
    'File Assembly (addCoreTemplateFiles)',
    `Getting base template structure: ${exportOptions.template || 'typescript-react-vite'}...`
  );
  const templateFilesRaw = await templateManager.createProject(
    exportOptions.template || 'typescript-react-vite',
    {},
    exportOptions
  );
  logger.info(
    'File Assembly (addCoreTemplateFiles)',
    `Base template files retrieved: ${Object.keys(templateFilesRaw).length}`
  );

  // Start with template files and overwrite/add custom files
  const projectFiles: Record<string, string> = { ...templateFilesRaw };
  Object.assign(projectFiles, customFiles);

  logger.info(
    'File Assembly (addCoreTemplateFiles)',
    'Core template files and custom code merged.'
  );
  return projectFiles;
}
