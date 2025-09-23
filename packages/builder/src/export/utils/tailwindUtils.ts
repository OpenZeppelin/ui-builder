import { logger } from '@openzeppelin/ui-builder-utils';

/**
 * Modifies the content paths within tailwind.config.cjs content string.
 * For Tailwind v4, this is a no-op since content paths are automatically detected.
 * For Tailwind v3 and earlier, this ensures that Tailwind scans all necessary files
 * in the exported project, including those from the renderer package.
 *
 * @param originalContent - The original content of tailwind.config.cjs.
 * @returns The modified content string (or original for Tailwind v4).
 */
export function modifyTailwindConfigContentForExport(originalContent: string): string {
  // Check if this is a Tailwind v4 config
  // v4 configs typically have comments about automatic content detection
  // or lack a content property entirely
  const isTailwindV4 =
    originalContent.includes('Content paths are automatically detected by Tailwind v4') ||
    originalContent.includes('Tailwind v4') ||
    !originalContent.match(/(content\s*:\s*\[)([\s\S]*?)(\])/);

  if (isTailwindV4) {
    logger.info(
      'TailwindUtils',
      'Detected Tailwind v4 config. Content paths are automatically detected, no modification needed.'
    );
    return originalContent;
  }

  // For Tailwind v3 or earlier, we need to modify the content paths
  const newContentPaths = [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // Scan app's src directory
    // Ensure node_modules is scanned broadly enough if renderer components are there
    // This path assumes renderer might be a direct dependency or symlinked in a way that needs explicit scanning.
    // Adjust if renderer styles are expected to be found elsewhere or if its components are self-contained regarding styles.
    './node_modules/@openzeppelin/ui-builder-renderer/dist/**/*.{js,ts,jsx,tsx}', // More specific path to renderer components
    './node_modules/@openzeppelin/ui-builder-renderer/src/**/*.{js,ts,jsx,tsx}', // If src is also published or linked
  ]
    .map((p) => `      '${p}'`) // Indent for formatting
    .join(',\n');

  // Regex to find 'content: [' ... ']' and replace its contents
  const modifiedContent = originalContent.replace(
    /(content\s*:\s*\[)([\s\S]*?)(\])/,
    `$1\n${newContentPaths}\n    $3` // Replace with new paths, keeping original brackets and indentation around array
  );

  if (modifiedContent === originalContent) {
    logger.warn(
      'TailwindUtils',
      'Failed to replace content paths in tailwind.config.cjs. Check config format. Using original content.'
    );
    return originalContent;
  }
  logger.info(
    'TailwindUtils',
    'Successfully modified tailwind.config.cjs content paths for export (Tailwind v3).'
  );
  return modifiedContent;
}
