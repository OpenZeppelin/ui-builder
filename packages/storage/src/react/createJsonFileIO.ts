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
      const text = await file.text();
      return await importJson(text);
    } catch (error) {
      onError?.('Failed to import', error);
      throw error;
    }
  };

  return { exportAsFile, importFromFile } as const;
}
