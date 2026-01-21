import JSZip from 'jszip';

import { logger } from '@openzeppelin/ui-utils';

/**
 * Optional callback for testing error handling during file extraction.
 * @param filePath The path of the file being processed.
 * @param fileObject The JSZip file object.
 * @returns void | Promise<void> - If it throws an error, extraction for that file will fail.
 */
export type ZipExtractionTestCallback = (
  filePath: string,
  fileObject: JSZip.JSZipObject
) => void | Promise<void>;

/**
 * Extracts all files from a ZIP blob into a record of paths and string content.
 * Handles potential extraction errors gracefully.
 * @param zipBlob The ZIP file content as a Blob.
 * @param testCallback Optional callback for simulating errors during testing.
 */
export async function extractFilesFromZip(
  zipData: Blob | Buffer,
  testCallback?: ZipExtractionTestCallback
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  try {
    const zip = await JSZip.loadAsync(zipData);

    // Create an array of promises for file extraction
    const extractionPromises = Object.entries(zip.files).map(async ([path, fileObject]) => {
      // Skip directories
      if (fileObject.dir) {
        return;
      }

      try {
        // --- TEST HOOK START ---
        // If a test callback is provided, execute it here.
        // If it throws, the catch block below will handle it.
        if (testCallback) {
          await testCallback(path, fileObject);
        }
        // --- TEST HOOK END ---

        // Extract file content as text
        files[path] = await fileObject.async('text');
      } catch (error) {
        // Log the error and store an error message in the files record
        const errorMessage = `ERROR_EXTRACTING: ${(error as Error).message}`;
        logger.error('zipInspector', `Error extracting file ${path}:`, error); // Use logger
        files[path] = errorMessage;
      }
    });

    // Wait for all extraction attempts to complete
    await Promise.all(extractionPromises);
  } catch (error) {
    // Log error if the ZIP itself cannot be loaded
    logger.error('zipInspector', 'Error loading or processing ZIP file:', error);
    // You might want to throw this error or handle it differently
    // For now, return the potentially partially populated files object or an empty one
  }
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
