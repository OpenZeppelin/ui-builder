/**
 * TemplateManager Class
 *
 * This class is responsible for accessing template files from the codebase
 * and providing them for export without requiring filesystem operations.
 * It implements in-memory project generation to allow browser-based exports.
 */

import type { TemplateOptions } from '../core/types/ExportTypes';

// Define the structure used for imported template files
interface TemplateFileCollection {
  [key: string]: Record<string, string>;
}

// Template registry type - maps template names to file collections
type TemplateRegistry = Record<string, Record<string, string>>;

// In a real implementation, this would use Vite's import.meta.glob to load template files
// at build time. For now, we're using a placeholder approach that will be populated during build.
const templateFiles: TemplateFileCollection = {
  'typescript-react-vite': {},
};

/**
 * TemplateManager is responsible for managing template projects
 * used for exporting standalone form applications.
 */
export class TemplateManager {
  private readonly templates: TemplateRegistry;
  private version: string;

  /**
   * Creates a new TemplateManager instance
   */
  constructor() {
    // Initialize with the pre-loaded template files
    this.templates = this.processTemplateFiles();
    // Get version from package.json
    this.version = this.getPackageVersion();
  }

  /**
   * Process the imported template files to create a more usable structure
   */
  private processTemplateFiles(): TemplateRegistry {
    const registry: TemplateRegistry = {};

    // Process all imported template files
    for (const templateName in templateFiles) {
      if (Object.prototype.hasOwnProperty.call(templateFiles, templateName)) {
        registry[templateName] = {};

        const files = templateFiles[templateName];
        for (const filePath in files) {
          if (Object.prototype.hasOwnProperty.call(files, filePath)) {
            // Extract relative path within the template
            // e.g., '/packages/templates/typescript-react-vite/src/main.tsx' -> 'src/main.tsx'
            const match = filePath.match(/\/packages\/templates\/[^/]+\/(.+)$/);
            if (match) {
              const relativePath = match[1];
              registry[templateName][relativePath] = files[filePath];
            }
          }
        }
      }
    }

    return registry;
  }

  /**
   * Get the package version (for template versioning)
   */
  private getPackageVersion(): string {
    try {
      // In a production environment, this would come from package.json
      // Since we're in a browser context, we'll use a hardcoded value
      // that gets updated during the build process
      return '1.0.0';
    } catch (error) {
      console.warn('Failed to get package version:', error);
      return '0.0.0';
    }
  }

  /**
   * Get a list of available template names
   */
  getAvailableTemplates(): string[] {
    return Object.keys(this.templates);
  }

  /**
   * Get template files for a specific template
   *
   * @param templateName The name of the template to retrieve
   * @param options Additional options for template customization
   * @returns A record of file paths to file contents
   */
  getTemplateFiles(templateName: string, options: TemplateOptions = {}): Record<string, string> {
    // Check if template exists
    if (!this.templates[templateName]) {
      throw new Error(
        `Template "${templateName}" not found. Available templates: ${this.getAvailableTemplates().join(', ')}`
      );
    }

    // Clone the template files to avoid modifying the original
    const files: Record<string, string> = { ...this.templates[templateName] };

    // Apply template version
    if (files['package.json']) {
      const packageJson = JSON.parse(files['package.json']);
      packageJson.templateVersion = this.version;
      files['package.json'] = JSON.stringify(packageJson, null, 2);
    }

    // Apply any custom modifications based on options
    this.applyTemplateOptions(files, options);

    return files;
  }

  /**
   * Apply template options to customize the output
   */
  private applyTemplateOptions(files: Record<string, string>, options: TemplateOptions): void {
    // Example: Custom project name in package.json
    if (options.projectName && files['package.json']) {
      const packageJson = JSON.parse(files['package.json']);
      packageJson.name = options.projectName;
      files['package.json'] = JSON.stringify(packageJson, null, 2);
    }

    // Example: Custom README content
    if (options.description && files['README.md']) {
      files['README.md'] = files['README.md'].replace(
        /{{\s*PROJECT_DESCRIPTION\s*}}/g,
        options.description
      );
    }

    // Additional customizations can be added here
  }

  /**
   * Create an in-memory project with the given template files and custom content
   *
   * @param templateName The name of the template to use
   * @param customFiles Custom files to include or replace in the template
   * @param options Additional options for template customization
   * @returns A record of file paths to file contents for the complete project
   */
  createProject(
    templateName: string,
    customFiles: Record<string, string> = {},
    options: TemplateOptions = {}
  ): Record<string, string> {
    // Get base template files
    const templateFiles = this.getTemplateFiles(templateName, options);

    // Merge custom files, overwriting template files if needed
    const projectFiles = {
      ...templateFiles,
      ...customFiles,
    };

    // Apply special transformations for placeholder files
    this.processPlaceholderFiles(projectFiles, customFiles);

    return projectFiles;
  }

  /**
   * Process placeholder files in the template
   */
  private processPlaceholderFiles(
    projectFiles: Record<string, string>,
    customFiles: Record<string, string>
  ): void {
    // Replace FormPlaceholder.tsx with the generated form if provided
    if (
      customFiles['src/components/GeneratedForm.tsx'] &&
      projectFiles['src/components/FormPlaceholder.tsx']
    ) {
      // Remove the placeholder
      delete projectFiles['src/components/FormPlaceholder.tsx'];
    }

    // Similar logic for other placeholder files
    if (
      customFiles['src/adapters/evm/adapter.ts'] &&
      projectFiles['src/adapters/AdapterPlaceholder.ts']
    ) {
      delete projectFiles['src/adapters/AdapterPlaceholder.ts'];
    }
  }
}
