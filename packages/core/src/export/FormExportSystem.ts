/**
 * FormExportSystem
 *
 * This class coordinates the form export process by integrating the
 * TemplateManager, FormCodeGenerator, AdapterExportManager, PackageManager,
 * and StyleManager components.
 */

import { FormCodeGenerator } from './generators/FormCodeGenerator';
import { TemplateProcessor } from './generators/TemplateProcessor';
import { AdapterExportManager } from './AdapterExportManager';
import { PackageManager } from './PackageManager';
import { StyleManager } from './StyleManager';
import { TemplateManager } from './TemplateManager';
import { ZipGenerator, type ZipProgress } from './ZipGenerator';

import type { ChainType } from '../core/types/ContractSchema';
import type { ExportOptions, ExportResult } from '../core/types/ExportTypes';
import type { BuilderFormConfig } from '../core/types/FormTypes';

// Define an interface for constructor dependencies (optional)
interface FormExportSystemDependencies {
  templateManager?: TemplateManager;
  formCodeGenerator?: FormCodeGenerator;
  adapterExportManager?: AdapterExportManager;
  packageManager?: PackageManager;
  styleManager?: StyleManager;
  zipGenerator?: ZipGenerator;
  templateProcessor?: TemplateProcessor;
}

/**
 * FormExportSystem class coordinates the complete form export process,
 * integrating the template system, code generator, adapter export, package management,
 * and style management.
 */
export class FormExportSystem {
  private templateManager: TemplateManager;
  private formCodeGenerator: FormCodeGenerator;
  private adapterExportManager: AdapterExportManager;
  private packageManager: PackageManager;
  private styleManager: StyleManager;
  private zipGenerator: ZipGenerator;
  private templateProcessor: TemplateProcessor;

  /**
   * Creates a new FormExportSystem instance, initializing all necessary managers.
   * Accepts optional dependencies for testing purposes.
   */
  constructor(dependencies: FormExportSystemDependencies = {}) {
    // Use provided instances or create new ones
    this.templateManager = dependencies.templateManager ?? new TemplateManager();
    this.formCodeGenerator = dependencies.formCodeGenerator ?? new FormCodeGenerator();
    this.adapterExportManager = dependencies.adapterExportManager ?? new AdapterExportManager();
    // Assuming PackageManager needs args - adjust if constructor changes
    this.packageManager = dependencies.packageManager ?? new PackageManager();
    this.styleManager = dependencies.styleManager ?? new StyleManager();
    this.zipGenerator = dependencies.zipGenerator ?? new ZipGenerator();
    this.templateProcessor = dependencies.templateProcessor ?? new TemplateProcessor({});
  }

  /**
   * Main entry point for the export process. Exports a form based on the provided
   * form configuration, chain type, and options.
   *
   * @param formConfig Form configuration created in the builder
   * @param chainType Blockchain type (evm, solana, etc.)
   * @param functionId Function ID this form is for
   * @param options Export customization options
   * @returns An export result with the file blob and metadata
   */
  async exportForm(
    formConfig: BuilderFormConfig,
    chainType: ChainType,
    functionId: string,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    // Ensure chainType is set in options
    const exportOptions: ExportOptions = {
      chainType,
      ...options,
    };

    try {
      console.log('[Export System] Starting export process...');
      console.log('[Export System] Options:', exportOptions);

      // 1. Generate form component code
      console.log('[Export System] Generating form component...');
      const formComponentCode = await this.formCodeGenerator.generateFormComponent(
        formConfig,
        chainType,
        functionId
      );

      // 2. Generate App component code
      console.log('[Export System] Generating App component...');
      const appComponentCode = await this.formCodeGenerator.generateUpdatedAppComponent(functionId);

      // 3. Get adapter files if needed
      console.log('[Export System] Retrieving adapter files...');
      const adapterFiles =
        exportOptions.includeAdapters !== false
          ? await this.adapterExportManager.getAdapterFiles(chainType)
          : {};
      console.log(`[Export System] Retrieved ${Object.keys(adapterFiles).length} adapter file(s).`);

      // Prepare custom files object
      const customFiles = {
        'src/App.tsx': appComponentCode,
        'src/components/GeneratedForm.tsx': formComponentCode,
        ...adapterFiles,
      };

      // --- Assemble Project Files ---
      console.log('[Export System] Assembling project files...');
      const projectFiles = await this.assembleProjectFiles(
        formConfig,
        chainType,
        functionId,
        exportOptions,
        customFiles
      );
      console.log(`[Export System] Project files assembled: ${Object.keys(projectFiles).length}`);
      // --- End Assembly ---

      // --- Final Steps ---
      // 10. Create ZIP file
      console.log('[Export System] Generating ZIP file...');
      const fileName = this.generateFileName(functionId);
      const zipResult = await this.createZipFile(projectFiles, fileName, exportOptions.onProgress);
      console.log(`[Export System] ZIP file generated: ${zipResult.fileName}`);

      // 11. Prepare and return the final export result
      const finalResult: ExportResult = {
        data: zipResult.data,
        fileName: zipResult.fileName,
        dependencies: this.packageManager.getDependencies(formConfig, chainType),
      };
      console.log('[Export System] Export process complete.');
      return finalResult;
    } catch (error) {
      console.error('[Export System] Export failed:', error);
      throw new Error(`Export failed: ${(error as Error).message}`);
    }
  }

  /**
   * Assembles the complete set of project files by merging template files,
   * generated code, styles, configs, and applying necessary modifications.
   * @private
   */
  private async assembleProjectFiles(
    formConfig: BuilderFormConfig,
    chainType: ChainType,
    functionId: string,
    exportOptions: ExportOptions,
    customFiles: Record<string, string>
  ): Promise<Record<string, string>> {
    // 4. Get base project files from the selected template
    console.log(
      `[File Assembly] Creating project from template: ${exportOptions.template || 'typescript-react-vite'}...`
    );
    const templateFilesRaw = await this.templateManager.createProject(
      exportOptions.template || 'typescript-react-vite',
      customFiles, // Pass custom files to handle placeholders
      exportOptions
    );
    console.log(
      `[File Assembly] Base template files retrieved: ${Object.keys(templateFilesRaw).length}`
    );

    // Initialize the final file collection
    let projectFiles: Record<string, string> = { ...templateFilesRaw };

    // 5. Add shared CSS files (global.css, data-slots.css) and template styles.css via StyleManager
    console.log('[File Assembly] Adding CSS files...');
    const styleFiles = this.styleManager.getStyleFiles();
    styleFiles.forEach((file) => {
      projectFiles[file.path] = file.content;
    });
    console.log(`[File Assembly] Added ${styleFiles.length} CSS file(s).`);

    // 6. Add root configuration files (tailwind, postcss, components) via StyleManager
    console.log('[File Assembly] Adding root config files...');
    const configFiles = this.styleManager.getConfigFiles();
    configFiles.forEach((file) => {
      if (file.path === 'tailwind.config.cjs') {
        projectFiles[file.path] = this.modifyTailwindConfigContent(file.content);
      } else {
        projectFiles[file.path] = file.content;
      }
    });
    console.log(`[File Assembly] Added ${configFiles.length} config file(s).`);

    // 7. Remove adapter directory if adapters are excluded
    if (exportOptions.includeAdapters === false) {
      console.log('[File Assembly] Removing adapter files as per options...');
      Object.keys(projectFiles).forEach((path) => {
        if (path.startsWith('src/adapters/')) {
          delete projectFiles[path];
        }
      });
    }

    // 8. Update package.json with correct dependencies and metadata
    console.log('[File Assembly] Updating package.json...');
    const originalPackageJson = projectFiles['package.json'];
    if (originalPackageJson) {
      projectFiles['package.json'] = this.packageManager.updatePackageJson(
        originalPackageJson,
        formConfig,
        chainType,
        functionId,
        exportOptions
      );
      console.log('[File Assembly] package.json updated.');
    } else {
      console.error('[File Assembly] Error: No package.json found in template files.');
      throw new Error('Template is missing package.json');
    }

    // 9. Format necessary JSON files for readability
    console.log('[File Assembly] Formatting JSON files...');
    await this.formatJsonFiles(projectFiles);

    console.log('[File Assembly] File assembly complete.');
    return projectFiles;
  }

  /**
   * Modifies the content paths within tailwind.config.cjs content string.
   * @param originalContent The original content of tailwind.config.cjs.
   * @returns The modified content string.
   * @private
   */
  private modifyTailwindConfigContent(originalContent: string): string {
    // Define paths relative to the EXPORTED project root
    const newContentPaths = `[
      './index.html',
      './src/**/*.{js,ts,jsx,tsx}',
    ]`;
    // Replace the 'content: [...]' array in the config string
    const modifiedContent = originalContent.replace(
      /(content\s*:\s*\[)[\s\S]*?(\])/, // Regex to find 'content: [' ... ']'
      `$1${newContentPaths}$2` // Replace array content
    );

    if (modifiedContent === originalContent) {
      // Warn if replacement failed, return original content
      console.warn(
        '[Export System] Failed to replace content paths in tailwind.config.cjs. Check config format. Using original.'
      );
      return originalContent;
    } else {
      console.log('[Export System] Successfully modified tailwind.config.cjs content paths.');
      return modifiedContent;
    }
  }

  /**
   * Format JSON files with Prettier
   *
   * @param files Map of file paths to content
   */
  private async formatJsonFiles(files: Record<string, string>): Promise<void> {
    // Get all .json files by checking file extensions
    const jsonFiles = Object.keys(files).filter((path) => path.endsWith('.json'));

    console.log('Found JSON files to format:', jsonFiles);

    for (const path of jsonFiles) {
      try {
        console.log(`Formatting ${path} with JSON formatter...`);
        const before = files[path].substring(0, 100) + '...'; // Log first 100 chars

        // Use our specialized JSON formatter
        files[path] = await this.templateProcessor.formatJson(files[path]);

        const after = files[path].substring(0, 100) + '...'; // Log first 100 chars
        console.log(`Before formatting: ${before}`);
        console.log(`After formatting: ${after}`);
      } catch (error) {
        console.warn(`Failed to format ${path}, using unformatted version:`, error);
      }
    }
  }

  /**
   * Create a ZIP file from the project files
   *
   * @param files Map of file paths to content
   * @param fileName Suggested filename for the ZIP
   * @param onProgress Optional callback for progress updates
   * @returns A result containing the ZIP blob and filename
   */
  private async createZipFile(
    files: Record<string, string>,
    fileName: string,
    onProgress?: (progress: ZipProgress) => void
  ) {
    console.log(`Creating ZIP file with ${Object.keys(files).length} files`);

    return this.zipGenerator.createZipFile(files, fileName, {
      onProgress,
      compressionLevel: 6, // Moderate compression
    });
  }

  /**
   * Generate a filename for the exported package
   * @param functionId Function ID
   * @returns A suitable filename in kebab-case format
   */
  private generateFileName(functionId: string): string {
    // Convert to kebab case by replacing non-alphanumeric chars with hyphens
    const kebabName = functionId
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace sequences of non-alphanumeric chars with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    return `${kebabName}-form.zip`;
  }
}
