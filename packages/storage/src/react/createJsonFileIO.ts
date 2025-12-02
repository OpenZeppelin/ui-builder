type OnError = (title: string, err: unknown) => void;

/**
 * Creates file I/O utilities for importing and exporting data as JSON files with error handling.
 *
 * @param functions Object containing export and import functions
 * @param functions.exportJson Function that exports data to a JSON string
 * @param functions.importJson Function that imports data from a JSON string
 * @param options Configuration options
 * @param options.filePrefix Prefix for the downloaded filename
 * @param options.onError Optional error handler called with a title and the error
 * @param options.shouldExport Optional function to determine if export should proceed based on parsed data. Defaults to always true.
 * @returns Object containing exportAsFile and importFromFile functions
 */
export function createJsonFileIO(
  {
    exportJson,
    importJson,
  }: {
    exportJson: (ids?: string[]) => Promise<string>;
    importJson: (json: string) => Promise<string[]>;
  },
  {
    filePrefix,
    onError,
    shouldExport,
  }: {
    filePrefix: string;
    onError?: OnError;
    shouldExport?: (parsed: unknown) => boolean;
  }
) {
  const exportAsFile = async (ids?: string[]) => {
    try {
      const jsonData = await exportJson(ids);
      const parsed = JSON.parse(jsonData);

      // Check if export should proceed (allows custom validation logic)
      if (shouldExport && !shouldExport(parsed)) {
        return;
      }

      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filePrefix}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      onError?.('Failed to export', error);
      throw error;
    }
  };

  const importFromFile = async (file: File) => {
    try {
      // Read file contents with error handling for large files
      const text = await file.text();

      // Validate that the file contains parseable JSON
      try {
        JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON format');
      }

      return await importJson(text);
    } catch (error) {
      // Provide more specific error messages for common issues
      let errorMessage = 'Failed to import';
      if (error instanceof Error) {
        if (error.message.includes('memory') || error.message.includes('quota')) {
          errorMessage = 'File too large - insufficient memory';
        } else if (error.message.includes('Invalid JSON')) {
          errorMessage = 'Invalid JSON format';
        }
      }
      onError?.(errorMessage, error);
      throw error;
    }
  };

  return { exportAsFile, importFromFile } as const;
}
