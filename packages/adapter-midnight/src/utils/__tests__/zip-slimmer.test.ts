import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import { stripZipForFunction } from '../zip-slimmer';

describe('stripZipForFunction', () => {
  it('should keep only the selected circuit artifacts', async () => {
    // Create a mock ZIP with multiple circuits
    const zip = new JSZip();
    zip.file('contract/index.cjs', 'module.exports = {}');
    zip.file('contract/index.d.ts', 'export type Circuits = {}');
    zip.file('witnesses.js', 'export const witnesses = {}');
    zip.file('keys/increment.prover', new Uint8Array([1, 2, 3]));
    zip.file('keys/increment.verifier', new Uint8Array([4, 5, 6]));
    zip.file('zkir/increment.bzkir', new Uint8Array([7, 8, 9]));
    zip.file('keys/decrement.prover', new Uint8Array([10, 11, 12]));
    zip.file('keys/decrement.verifier', new Uint8Array([13, 14, 15]));
    zip.file('zkir/decrement.bzkir', new Uint8Array([16, 17, 18]));

    const originalZip = await zip.generateAsync({ type: 'uint8array' });

    // Strip to only 'increment' circuit
    const trimmed = await stripZipForFunction(originalZip, 'increment');

    // Load and inspect the trimmed ZIP
    const trimmedZip = await JSZip.loadAsync(trimmed);
    const files = Object.keys(trimmedZip.files);

    // Should include core files
    expect(files).toContain('contract/index.cjs');
    expect(files).toContain('contract/index.d.ts');
    expect(files).toContain('witnesses.js');

    // Should include only 'increment' circuit keys
    expect(files).toContain('keys/increment.prover');
    expect(files).toContain('keys/increment.verifier');
    expect(files).toContain('zkir/increment.bzkir');

    // Should NOT include 'decrement' circuit keys
    expect(files).not.toContain('keys/decrement.prover');
    expect(files).not.toContain('keys/decrement.verifier');
    expect(files).not.toContain('zkir/decrement.bzkir');
  });

  it('should handle base64 string input', async () => {
    const zip = new JSZip();
    zip.file('contract/index.cjs', 'module.exports = {}');
    zip.file('contract/index.d.ts', 'export type Circuits = {}');
    zip.file('keys/myCircuit.prover', new Uint8Array([1, 2]));
    zip.file('keys/myCircuit.verifier', new Uint8Array([3, 4]));

    const base64Zip = await zip.generateAsync({ type: 'base64' });

    const trimmed = await stripZipForFunction(base64Zip, 'myCircuit');

    const trimmedZip = await JSZip.loadAsync(trimmed);
    expect(trimmedZip.file('keys/myCircuit.prover')).toBeTruthy();
  });

  it('should exclude .map files from witness code', async () => {
    const zip = new JSZip();
    zip.file('contract/index.cjs', 'module.exports = {}');
    zip.file('contract/index.d.ts', 'export type Circuits = {}');
    zip.file('witnesses.js', 'export const witnesses = {}');
    zip.file('witnesses.js.map', '{"version":3}');
    zip.file('keys/test.prover', new Uint8Array([1]));
    zip.file('keys/test.verifier', new Uint8Array([2]));

    const originalZip = await zip.generateAsync({ type: 'uint8array' });
    const trimmed = await stripZipForFunction(originalZip, 'test');

    const trimmedZip = await JSZip.loadAsync(trimmed);
    const files = Object.keys(trimmedZip.files);

    expect(files).toContain('witnesses.js');
    expect(files).not.toContain('witnesses.js.map');
  });

  it('should return compressed output', async () => {
    const zip = new JSZip();
    zip.file('contract/index.cjs', 'module.exports = {}');
    zip.file('contract/index.d.ts', 'export type Circuits = {}');
    zip.file('keys/test.prover', new Uint8Array(1000).fill(0));
    zip.file('keys/test.verifier', new Uint8Array(1000).fill(0));

    const originalZip = await zip.generateAsync({ type: 'uint8array' });
    const trimmed = await stripZipForFunction(originalZip, 'test');

    // Compressed output should be smaller than uncompressed
    expect(trimmed.length).toBeLessThan(2500); // Much smaller due to compression
  });
});
