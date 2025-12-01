type OnError = (title: string, err: unknown) => void;

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
  }: {
    filePrefix: string;
    onError?: OnError;
  }
) {
  const exportAsFile = async (ids?: string[]) => {
    try {
      const jsonData = await exportJson(ids);
      const parsed = JSON.parse(jsonData);
      const count = parsed?.configurations?.length ?? 0;
      if (count === 0) return;

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
