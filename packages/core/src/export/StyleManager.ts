/**
 * StyleManager
 *
 * Responsible for gathering necessary styling assets (CSS, config files)
 * for the exported form project. Uses Vite's `?raw` imports to embed
 * file content at build time, ensuring consistency between browser
 * and CLI export environments.
 */

import componentsJsonContent from 'virtual:components-json-content';
import globalCssContent from 'virtual:global-css-content';
import postcssConfigContent from 'virtual:postcss-config-content';
import tailwindConfigContent from 'virtual:tailwind-config-content';
import templateStylesCssContent from 'virtual:template-vite-styles-css-content';

/**
 * Represents a file to be included in the export.
 */
export interface ExportedFile {
  path: string;
  content: string;
}

/**
 * Manages the collection of styling-related files (CSS, config) for export.
 */
export class StyleManager {
  /**
   * Retrieves the content of essential CSS files.
   * Uses virtual modules provided by a Vite plugin.
   * @returns {ExportedFile[]} An array of CSS file objects for export.
   */
  getStyleFiles(): ExportedFile[] {
    // Use content imported from virtual modules
    return [
      {
        path: 'src/styles/global.css', // Destination path in exported project
        content: globalCssContent,
      },
      {
        path: 'src/styles.css',
        content: templateStylesCssContent,
      },
    ];
  }

  /**
   * Retrieves the content of root configuration files.
   * Content is loaded via virtual modules provided by a Vite plugin.
   * @returns {ExportedFile[]} An array of config file objects for export.
   */
  getConfigFiles(): ExportedFile[] {
    // Use content imported from virtual modules
    return [
      {
        path: 'tailwind.config.cjs', // Destination path at the root
        content: tailwindConfigContent,
      },
      {
        path: 'postcss.config.cjs',
        content: postcssConfigContent,
      },
      {
        path: 'components.json',
        content: componentsJsonContent,
      },
    ];
  }
}
