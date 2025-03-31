import JSZip from 'jszip';

/**
 * Extracts all files from a ZIP archive provided as a Blob or Buffer.
 *
 * @param zipData - The ZIP data (Blob for browser, Buffer for Node.js).
 * @returns A promise resolving to a record mapping file paths to their string content.
 */
export async function extractFilesFromZip(zipData: Blob | Buffer): Promise<Record<string, string>> {
  const zip = new JSZip();
  const extracted = await zip.loadAsync(zipData);

  const files: Record<string, string> = {};

  // Use Promise.all to asynchronously extract file contents
  await Promise.all(
    Object.keys(extracted.files).map(async (path) => {
      const file = extracted.files[path];
      // Skip directories
      if (!file.dir) {
        try {
          // Extract file content as string regardless of binary status
          // This ensures binary files are handled properly in tests
          files[path] = await file.async('string');
        } catch (error) {
          console.error(`Error extracting file ${path}:`, error); // Keep detailed log
          // Format error messages consistently for better error handling
          files[path] =
            `ERROR_EXTRACTING: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
    })
  );

  return files;
}

/**
 * Options for validating an exported project
 */
export interface ProjectValidationOptions {
  /** List of files that must exist in the export */
  requiredFiles?: string[];
  /** List of files that should not exist in the export */
  forbiddenFiles?: string[];
  /** Object mapping file paths to validation functions */
  contentValidations?: Record<string, (content: string) => boolean | string>;
  /** Object mapping file paths to regex patterns that must match */
  contentPatterns?: Record<string, RegExp>;
}

/**
 * Result of validating an exported project
 */
export interface ProjectValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** List of validation errors */
  errors: string[];
  /** Information about the validation that passed */
  successes: string[];
}

/**
 * Validate an exported project against expectations
 * @param files - The files extracted from the ZIP
 * @param options - Validation options
 * @returns Validation result
 */
export function validateExportedProject(
  files: Record<string, string>,
  options: ProjectValidationOptions
): ProjectValidationResult {
  const errors: string[] = [];
  const successes: string[] = [];

  // Check required files
  if (options.requiredFiles) {
    for (const file of options.requiredFiles) {
      if (files[file] === undefined) {
        errors.push(`Missing required file: ${file}`);
      } else {
        successes.push(`Found required file: ${file}`);
      }
    }
  }

  // Check forbidden files
  if (options.forbiddenFiles) {
    for (const file of options.forbiddenFiles) {
      if (files[file] !== undefined) {
        errors.push(`Found forbidden file: ${file}`);
      } else {
        successes.push(`Correctly missing forbidden file: ${file}`);
      }
    }
  }

  // Check content validations
  if (options.contentValidations) {
    for (const [file, validator] of Object.entries(options.contentValidations)) {
      if (files[file] !== undefined) {
        const result = validator(files[file]);
        if (result !== true) {
          const message =
            typeof result === 'string' ? result : `Content validation failed for ${file}`;
          errors.push(message);
        } else {
          successes.push(`Content validation passed for ${file}`);
        }
      } else {
        errors.push(`Cannot validate missing file: ${file}`);
      }
    }
  }

  // Check regex patterns
  if (options.contentPatterns) {
    for (const [file, pattern] of Object.entries(options.contentPatterns)) {
      if (files[file] !== undefined) {
        if (!pattern.test(files[file])) {
          errors.push(`Pattern match failed for ${file}: ${pattern}`);
        } else {
          successes.push(`Pattern match passed for ${file}`);
        }
      } else {
        errors.push(`Cannot validate pattern on missing file: ${file}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    successes,
  };
}
