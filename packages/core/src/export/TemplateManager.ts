/**
 * TemplateManager Class
 *
 * This class is responsible for accessing template files from the codebase
 * and providing them for export without requiring filesystem operations.
 * It implements in-memory project generation to allow browser-based exports.
 */
import type { TemplateOptions } from '../core/types/ExportTypes';

// Template registry type - maps template names to file collections
type TemplateRegistry = Record<string, Record<string, string>>;

/**
 * Type for lazy glob import results
 */
type LazyGlobImportResult = Record<string, () => Promise<string>>;

// Template files are loaded lazily using Vite's import.meta.glob
// This allows code-splitting so the template files are only loaded when needed
const templateFiles = import.meta.glob<string>('../templates/**/*', {
  query: '?raw',
  import: 'default',
}) as LazyGlobImportResult;

// For testing purposes - make file paths available to tests
export const templateFilePaths = Object.keys(templateFiles);

/**
 * TemplateManager is responsible for managing template projects
 * used for exporting standalone form applications.
 */
export class TemplateManager {
  private templates: TemplateRegistry | null = null;
  private version: string;
  private initializing: Promise<void> | null = null;

  /**
   * Creates a new TemplateManager instance
   */
  constructor() {
    // Initialize version
    this.version = this.getPackageVersion();
    // Templates will be loaded on demand
    this.templates = null;
  }

  /**
   * Load templates if not already loaded
   */
  private async ensureTemplatesLoaded(): Promise<void> {
    // If already loaded, return immediately
    if (this.templates !== null) {
      return Promise.resolve();
    }

    // If already initializing, wait for that to complete
    if (this.initializing !== null) {
      return this.initializing;
    }

    // Start loading
    this.initializing = this.loadTemplates();
    await this.initializing;

    // Clear initializing promise
    this.initializing = null;
  }

  /**
   * Load and process all template files
   */
  private async loadTemplates(): Promise<void> {
    this.templates = await this.processTemplateFiles();
  }

  /**
   * Process the imported template files to create a more usable structure
   */
  private async processTemplateFiles(): Promise<TemplateRegistry> {
    const registry: TemplateRegistry = {};

    // Get all template file paths
    const paths = Object.keys(templateFiles);

    // Process all discovered template files
    for (const path of paths) {
      // Extract template name from path (e.g., '../templates/typescript-react-vite/package.json' -> 'typescript-react-vite')
      const match = path.match(/\/templates\/([^/]+)\//);
      if (match) {
        const templateName = match[1];

        // Initialize template entry if it doesn't exist
        if (!registry[templateName]) {
          registry[templateName] = {};
        }

        // Extract the relative file path within the template
        // e.g., '../templates/typescript-react-vite/package.json' -> 'package.json'
        const filePathMatch = path.match(/\/templates\/[^/]+\/(.+)$/);
        if (filePathMatch) {
          const relativePath = filePathMatch[1];
          // Load the file content asynchronously
          const content = await templateFiles[path]();
          registry[templateName][relativePath] = content;
        }
      }
    }

    // If no templates were found, throw an error
    if (Object.keys(registry).length === 0) {
      throw new Error(
        'No templates found. Please ensure template files exist in the templates directory.'
      );
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
   * Note: This will trigger template loading if not already loaded
   */
  async getAvailableTemplates(): Promise<string[]> {
    await this.ensureTemplatesLoaded();
    return Object.keys(this.templates!);
  }

  /**
   * Get template files for a specific template
   *
   * @param templateName The name of the template to retrieve
   * @param options Additional options for template customization
   * @returns A record of file paths to file contents
   */
  async getTemplateFiles(
    templateName: string,
    options: TemplateOptions = {}
  ): Promise<Record<string, string>> {
    await this.ensureTemplatesLoaded();

    // Check if template exists
    if (!this.templates![templateName]) {
      throw new Error(
        `Template "${templateName}" not found. Available templates: ${Object.keys(this.templates!).join(', ')}`
      );
    }

    // Clone the template files to avoid modifying the original
    const files: Record<string, string> = { ...this.templates![templateName] };

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
  async createProject(
    templateName: string,
    customFiles: Record<string, string> = {},
    options: TemplateOptions = {}
  ): Promise<Record<string, string>> {
    // Get base template files
    const templateFiles = await this.getTemplateFiles(templateName, options);

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
