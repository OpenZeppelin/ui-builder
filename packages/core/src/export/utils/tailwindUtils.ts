import { logger } from '@openzeppelin/transaction-form-renderer';

/**
 * Modifies the content paths within tailwind.config.cjs content string.
 * Ensures that Tailwind scans all necessary files in the exported project, including
 * those from the form-renderer package, to prevent incorrect purging of utility classes.
 *
 * @param originalContent - The original content of tailwind.config.cjs.
 * @returns The modified content string.
 */
export function modifyTailwindConfigContentForExport(originalContent: string): string {
  const newContentPaths = [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // Scan app's src directory
    // Ensure node_modules is scanned broadly enough if form-renderer components are there
    // This path assumes form-renderer might be a direct dependency or symlinked in a way that needs explicit scanning.
    // Adjust if form-renderer styles are expected to be found elsewhere or if its components are self-contained regarding styles.
    './node_modules/@openzeppelin/transaction-form-renderer/dist/**/*.{js,ts,jsx,tsx}', // More specific path to renderer components
    './node_modules/@openzeppelin/transaction-form-renderer/src/**/*.{js,ts,jsx,tsx}', // If src is also published or linked
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
      'TailwindUtils', // Changed system for logger
      'Failed to replace content paths in tailwind.config.cjs. Check config format. Using original content.'
    );
    return originalContent;
  }
  logger.info(
    'TailwindUtils',
    'Successfully modified tailwind.config.cjs content paths for export.'
  );
  return modifiedContent;
}
