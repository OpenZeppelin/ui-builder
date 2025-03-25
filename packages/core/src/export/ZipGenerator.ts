import JSZip from 'jszip';

/**
 * Options for ZIP file generation
 */
export interface ZipOptions {
  /**
   * Callback for progress updates during ZIP creation
   */
  onProgress?: (progress: ZipProgress) => void;

  /**
   * Compression level (0-9, where 0 = no compression, 9 = best compression)
   */
  compressionLevel?: number;
}

/**
 * Progress information for ZIP generation
 */
export interface ZipProgress {
  /**
   * Number of files processed so far
   */
  processedFiles?: number;

  /**
   * Total number of files to process
   */
  totalFiles?: number;

  /**
   * Overall percentage complete (0-100)
   */
  percent?: number;

  /**
   * Current file being processed
   */
  currentFile?: string;

  /**
   * Current operation (e.g., 'adding', 'compressing')
   */
  operation?: 'adding' | 'compressing';
}

/**
 * Result of ZIP generation
 */
export interface ZipResult {
  /**
   * The generated ZIP file as a Blob
   */
  blob: Blob;

  /**
   * Suggested filename for the ZIP
   */
  fileName: string;
}

/**
 * Service for generating ZIP files in the browser
 */
export class ZipGenerator {
  /**
   * Create a ZIP file from a collection of files
   *
   * @param files - Record of file paths to content
   * @param fileName - Name for the generated ZIP file
   * @param options - Configuration options
   * @returns Promise resolving to a Blob containing the ZIP file
   */
  async createZipFile(
    files: Record<string, string>,
    fileName: string,
    options: ZipOptions = {}
  ): Promise<ZipResult> {
    try {
      const zip = new JSZip();
      const totalFiles = Object.keys(files).length;
      let processedFiles = 0;

      // Add all files to the ZIP
      for (const [path, content] of Object.entries(files)) {
        // Normalize path for consistent structure
        const normalizedPath = this.normalizePath(path);

        // Add file to ZIP
        zip.file(normalizedPath, content);
        processedFiles++;

        // Report progress if callback provided
        if (options.onProgress) {
          options.onProgress({
            processedFiles,
            totalFiles,
            percent: (processedFiles / totalFiles) * 50, // First 50% is adding files
            currentFile: normalizedPath,
            operation: 'adding',
          });
        }
      }

      // Generate ZIP with compression
      const blob = await zip.generateAsync(
        {
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: {
            level: options.compressionLevel ?? 6, // Default to moderate compression
          },
        },
        (metadata) => {
          // Report compression progress if callback provided
          if (options.onProgress) {
            options.onProgress({
              percent: 50 + metadata.percent / 2, // Last 50% is compression
              operation: 'compressing',
            });
          }
        }
      );

      return {
        blob,
        fileName: this.ensureZipExtension(fileName),
      };
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      throw new Error(`Failed to create ZIP file: ${(error as Error).message}`);
    }
  }

  /**
   * Normalize a file path for consistent structure
   */
  private normalizePath(path: string): string {
    // Remove leading slashes
    return path.replace(/^[/\\]+/, '');
  }

  /**
   * Ensure the filename has a .zip extension
   */
  private ensureZipExtension(fileName: string): string {
    if (!fileName.toLowerCase().endsWith('.zip')) {
      return `${fileName}.zip`;
    }
    return fileName;
  }
}
