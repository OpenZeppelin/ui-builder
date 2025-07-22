import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import type { TemplateProcessor } from '../generators/TemplateProcessor';
import type { StyleManager } from '../StyleManager';
import { modifyTailwindConfigContentForExport } from '../utils/tailwindUtils';

/**
 * Adds shared CSS files and root configuration files (Tailwind, PostCSS, components.json)
 * to the project files map. Also formats these configuration files.
 *
 * @param projectFiles - The current map of project files to be modified.
 * @param styleManager - Instance of StyleManager.
 * @param templateProcessor - Instance of TemplateProcessor for formatting.
 */
export async function addStyleAndRootConfigFiles(
  projectFiles: Record<string, string>,
  styleManager: StyleManager,
  templateProcessor: TemplateProcessor
): Promise<void> {
  logger.info('File Assembly (addStyleAndRootConfigFiles)', 'Adding CSS and root config files...');
  const styleFiles = styleManager.getStyleFiles();
  styleFiles.forEach((file) => {
    projectFiles[file.path] = file.content;
  });
  logger.info(
    'File Assembly (addStyleAndRootConfigFiles)',
    `Added ${styleFiles.length} CSS file(s).`
  );

  const configFiles = styleManager.getConfigFiles();
  for (const file of configFiles) {
    let finalContent = file.content;
    if (file.path === 'tailwind.config.cjs') {
      finalContent = modifyTailwindConfigContentForExport(file.content);
      finalContent = await templateProcessor.formatFinalCode(finalContent, 'typescript');
    } else if (file.path === 'postcss.config.cjs') {
      finalContent = await templateProcessor.formatFinalCode(finalContent, 'babel');
    } else if (file.path === 'components.json') {
      finalContent = await templateProcessor.formatJson(file.content);
    }
    projectFiles[file.path] = finalContent;
  }
  logger.info(
    'File Assembly (addStyleAndRootConfigFiles)',
    `Added and formatted ${configFiles.length} root config file(s).`
  );
}
