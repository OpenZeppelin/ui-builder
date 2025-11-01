import JSZip from 'jszip';

/**
 * Produce a per-function trimmed ZIP that keeps core files (contract module, d.ts, witness)
 * and only the selected circuit's keys (prover, verifier) and zkir.
 */
export async function stripZipForFunction(
  originalZipData: Uint8Array | ArrayBuffer | Blob | string,
  functionId: string
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(
    originalZipData as Uint8Array | ArrayBuffer | Blob,
    typeof originalZipData === 'string' ? { base64: true } : undefined
  );
  const out = new JSZip();

  const files = Object.keys(zip.files);

  // Include core files
  for (const p of files) {
    if (p.endsWith('.cjs') && p.includes('contract')) {
      out.file(p, await zip.files[p].async('uint8array'));
    } else if (p.endsWith('.d.ts') || p.endsWith('.d.cts')) {
      out.file(p, await zip.files[p].async('string'));
    } else if (
      /witness/i.test(p) &&
      (p.endsWith('.cjs') || p.endsWith('.js')) &&
      !p.endsWith('.map')
    ) {
      out.file(p, await zip.files[p].async('string'));
    }
  }

  // Keep only the selected circuit's artifacts
  const f = functionId;
  for (const p of files) {
    if (
      p.endsWith(`${f}.prover`) ||
      p.endsWith(`${f}.verifier`) ||
      p.endsWith(`${f}.bzkir`) ||
      p.endsWith(`${f}.zkir`)
    ) {
      out.file(p, await zip.files[p].async('uint8array'));
    }
  }

  return out.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
