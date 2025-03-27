import JSZip from 'jszip';

/**
 * Extract files from a ZIP blob
 * @param zipBlob - The ZIP file as a Blob
 * @returns A record of file paths to their contents as strings
 */
export async function extractFilesFromZip(zipBlob: Blob): Promise<Record<string, string>> {
  const zip = new JSZip();
  const extracted = await zip.loadAsync(zipBlob);

  const files: Record<string, string> = {};

  // Process each file in the ZIP
  const filePromises = Object.keys(extracted.files)
    .filter((path) => !extracted.files[path].dir)
    .map(async (path) => {
      // Skip binary files and only process text files
      const isBinary = isBinaryFile(path);
      if (isBinary) {
        files[path] = '[binary file]';
        return;
      }

      try {
        const content = await extracted.files[path].async('string');
        files[path] = content;
      } catch (error) {
        console.warn(`Error extracting file ${path}:`, error);
        files[path] = `[error: ${error instanceof Error ? error.message : String(error)}]`;
      }
    });

  await Promise.all(filePromises);
  return files;
}

/**
 * Check if a file is likely to be binary based on its extension
 */
function isBinaryFile(filePath: string): boolean {
  const binaryExtensions = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.otf',
    '.zip',
    '.tar',
    '.gz',
    '.7z',
    '.rar',
    '.exe',
    '.dll',
    '.so',
    '.dylib',
    '.bin',
    '.dat',
  ];

  return binaryExtensions.some((ext) => filePath.toLowerCase().endsWith(ext));
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
