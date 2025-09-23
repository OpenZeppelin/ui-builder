/**
 * Creates a downloadable file from a Blob or ArrayBuffer.
 * @param blob - The blob data to download
 * @param fileName - The name to give the downloaded file
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}
