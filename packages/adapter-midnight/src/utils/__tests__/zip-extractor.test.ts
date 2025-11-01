import JSZip from 'jszip';
import { beforeAll, describe, expect, it } from 'vitest';

import { extractMidnightContractZip, validateMidnightZip } from '../zip-extractor';

describe('ZIP Extractor', () => {
  let validZipData: string;
  let invalidZipData: string;

  beforeAll(async () => {
    // Create a valid test ZIP
    const validZip = new JSZip();
    validZip.file('contract/index.cjs', 'module.exports = { Contract: function() {} };');
    validZip.file('contract/index.d.ts', 'export interface TestContract { test(): void; }');
    validZip.file('keys/increment.verifier', JSON.stringify({ key: 'test-verifier' }));
    validZip.file('witness.js', 'export const witnesses = { test: () => {} };');
    validZipData = await validZip.generateAsync({ type: 'base64' });

    // Create an invalid test ZIP (missing required files)
    const invalidZip = new JSZip();
    invalidZip.file('readme.txt', 'This is not a valid contract ZIP');
    invalidZipData = await invalidZip.generateAsync({ type: 'base64' });
  });

  describe('extractMidnightContractZip', () => {
    it('should extract all components from a valid ZIP', async () => {
      // JSZip can handle base64 directly when passed as a string with 'base64' type
      const result = await extractMidnightContractZip(validZipData);

      expect(result.contractModule).toBeDefined();
      expect(result.contractModule).toContain('module.exports');

      expect(result.contractDefinition).toBeDefined();
      expect(result.contractDefinition).toContain('TestContract');

      expect(result.verifierKeys).toBeDefined();
      expect(result.verifierKeys?.increment).toEqual({ key: 'test-verifier' });

      expect(result.witnessCode).toBeDefined();
      expect(result.witnessCode).toContain('witnesses');
    });

    it('should throw error for missing contract module', async () => {
      await expect(extractMidnightContractZip(invalidZipData)).rejects.toThrow(
        'Missing required contract module'
      );
    });

    it('should handle ArrayBuffer input', async () => {
      const buffer = Uint8Array.from(atob(validZipData), (c) => c.charCodeAt(0)).buffer;
      const result = await extractMidnightContractZip(buffer);

      expect(result.contractModule).toBeDefined();
      expect(result.contractDefinition).toBeDefined();
    });

    it('should handle Blob input', async () => {
      const buffer = Uint8Array.from(atob(validZipData), (c) => c.charCodeAt(0));
      const blob = new Blob([buffer], { type: 'application/zip' });
      const result = await extractMidnightContractZip(blob);

      expect(result.contractModule).toBeDefined();
      expect(result.contractDefinition).toBeDefined();
    });
  });

  describe('validateMidnightZip', () => {
    it('should validate a correct ZIP structure', async () => {
      const result = await validateMidnightZip(validZipData);

      expect(result.isValid).toBe(true);
      expect(result.hasContractModule).toBe(true);
      expect(result.hasContractDefinition).toBe(true);
      expect(result.hasVerifierKeys).toBe(true);
      expect(result.hasWitnessCode).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required files', async () => {
      const result = await validateMidnightZip(invalidZipData);

      expect(result.isValid).toBe(false);
      expect(result.hasContractModule).toBe(false);
      expect(result.hasContractDefinition).toBe(false);
      expect(result.errors).toContain('No contract module (.cjs) file found');
      expect(result.errors).toContain('No contract definition (.d.ts) file found');
    });

    it('should handle invalid ZIP data', async () => {
      const result = await validateMidnightZip('not-a-zip');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid ZIP file format');
    });
  });
});
