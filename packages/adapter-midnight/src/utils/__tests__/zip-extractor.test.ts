import JSZip from 'jszip';
import { beforeAll, describe, expect, it } from 'vitest';

import { extractMidnightContractZip, validateMidnightZip } from '../zip-extractor';

describe('ZIP Extractor', () => {
  let validZipData: string;
  let invalidZipData: string;
  let zipWithZkArtifacts: string;
  let zipWithReExports: string;
  let zipWithLegacyZkir: string;

  beforeAll(async () => {
    // Create a valid test ZIP
    const validZip = new JSZip();
    validZip.file('contract/index.cjs', 'module.exports = { Contract: function() {} };');
    validZip.file(
      'contract/index.d.ts',
      'export type Circuits = { test: () => void }; export type Ledger = {};'
    );
    validZip.file('keys/increment.verifier', JSON.stringify({ key: 'test-verifier' }));
    validZip.file('witness.js', 'export const witnesses = { test: () => {} };');
    validZipData = await validZip.generateAsync({ type: 'base64' });

    // Create an invalid test ZIP (missing required files)
    const invalidZip = new JSZip();
    invalidZip.file('readme.txt', 'This is not a valid contract ZIP');
    invalidZipData = await invalidZip.generateAsync({ type: 'base64' });

    // Create a ZIP with ZK artifacts
    const zkZip = new JSZip();
    zkZip.file('contract/index.cjs', 'module.exports = { Contract: function() {} };');
    zkZip.file(
      'contract/index.d.ts',
      'export type Circuits = { increment: () => void }; export type Ledger = {};'
    );
    zkZip.file('keys/increment.prover', new Uint8Array([1, 2, 3, 4]));
    zkZip.file('keys/increment.verifier', new Uint8Array([5, 6, 7, 8]));
    zkZip.file('zkir/increment.bzkir', new Uint8Array([9, 10, 11, 12]));
    zkZip.file('keys/decrement.prover', new Uint8Array([13, 14, 15, 16]));
    zkZip.file('keys/decrement.verifier', new Uint8Array([17, 18, 19, 20]));
    zipWithZkArtifacts = await zkZip.generateAsync({ type: 'base64' });

    // Create a ZIP with re-exports
    const reExportZip = new JSZip();
    reExportZip.file('dist/contract/index.cjs', 'module.exports = { Contract: function() {} };');
    reExportZip.file('dist/contract/index.d.ts', 'export * from "./types";');
    reExportZip.file(
      'dist/contract/types.d.ts',
      'export type Circuits = { test: () => void }; export type Ledger = {};'
    );
    zipWithReExports = await reExportZip.generateAsync({ type: 'base64' });

    // Create a ZIP with legacy .zkir instead of .bzkir
    const legacyZkZip = new JSZip();
    legacyZkZip.file('contract/index.cjs', 'module.exports = { Contract: function() {} };');
    legacyZkZip.file(
      'contract/index.d.ts',
      'export type Circuits = { test: () => void }; export type Ledger = {};'
    );
    legacyZkZip.file('keys/test.prover', new Uint8Array([1, 2, 3]));
    legacyZkZip.file('keys/test.verifier', new Uint8Array([4, 5, 6]));
    legacyZkZip.file('zkir/test.zkir', new Uint8Array([7, 8, 9]));
    zipWithLegacyZkir = await legacyZkZip.generateAsync({ type: 'base64' });
  });

  describe('extractMidnightContractZip', () => {
    it('should extract all components from a valid ZIP', async () => {
      const result = await extractMidnightContractZip(validZipData);

      expect(result.contractModule).toBeDefined();
      expect(result.contractModule).toContain('module.exports');

      expect(result.contractDefinition).toBeDefined();
      expect(result.contractDefinition).toContain('Circuits');
      expect(result.contractDefinition).toContain('Ledger');

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

    it('should extract ZK artifacts (prover, verifier, bzkir)', async () => {
      const result = await extractMidnightContractZip(zipWithZkArtifacts);

      expect(result.zkArtifacts).toBeDefined();
      expect(Object.keys(result.zkArtifacts || {})).toHaveLength(2);

      expect(result.zkArtifacts?.increment).toBeDefined();
      expect(result.zkArtifacts?.increment.prover).toEqual(new Uint8Array([1, 2, 3, 4]));
      expect(result.zkArtifacts?.increment.verifier).toEqual(new Uint8Array([5, 6, 7, 8]));
      expect(result.zkArtifacts?.increment.zkir).toEqual(new Uint8Array([9, 10, 11, 12]));

      expect(result.zkArtifacts?.decrement).toBeDefined();
      expect(result.zkArtifacts?.decrement.prover).toEqual(new Uint8Array([13, 14, 15, 16]));
      expect(result.zkArtifacts?.decrement.verifier).toEqual(new Uint8Array([17, 18, 19, 20]));
    });

    it('should handle legacy .zkir files', async () => {
      const result = await extractMidnightContractZip(zipWithLegacyZkir);

      expect(result.zkArtifacts).toBeDefined();
      expect(result.zkArtifacts?.test).toBeDefined();
      expect(result.zkArtifacts?.test.zkir).toEqual(new Uint8Array([7, 8, 9]));
    });

    it('should resolve re-exports in TypeScript definitions', async () => {
      const result = await extractMidnightContractZip(zipWithReExports);

      expect(result.contractDefinition).toBeDefined();
      expect(result.contractDefinition).toContain('Circuits');
      expect(result.contractDefinition).toContain('Ledger');
    });

    it('should filter out macOS system files', async () => {
      const macZip = new JSZip();
      macZip.file('contract/index.cjs', 'module.exports = {};');
      macZip.file('contract/index.d.ts', 'export type Circuits = {};');
      macZip.file('__MACOSX/._file.txt', 'resource fork');
      macZip.file('.DS_Store', 'system file');
      const macZipData = await macZip.generateAsync({ type: 'base64' });

      const result = await extractMidnightContractZip(macZipData);

      expect(result.contractModule).toBeDefined();
      expect(result.contractDefinition).toBeDefined();
    });

    it('should prefer index.cjs over other contract modules', async () => {
      const multiModuleZip = new JSZip();
      multiModuleZip.file('contract/index.cjs', 'module.exports = { main: true };');
      multiModuleZip.file('contract/other.cjs', 'module.exports = { other: true };');
      multiModuleZip.file('contract/index.d.ts', 'export type Circuits = {};');
      const multiModuleData = await multiModuleZip.generateAsync({ type: 'base64' });

      const result = await extractMidnightContractZip(multiModuleData);

      expect(result.contractModule).toContain('main: true');
      expect(result.contractModule).not.toContain('other: true');
    });

    it('should prioritize .cjs witness files over .js and .ts', async () => {
      const witnessZip = new JSZip();
      witnessZip.file('contract/index.cjs', 'module.exports = {};');
      witnessZip.file('contract/index.d.ts', 'export type Circuits = {};');
      witnessZip.file('witness.ts', 'export const witnesses = { ts: true };');
      witnessZip.file('witness.js', 'export const witnesses = { js: true };');
      witnessZip.file('witness.cjs', 'module.exports = { witnesses: { cjs: true } };');
      const witnessData = await witnessZip.generateAsync({ type: 'base64' });

      const result = await extractMidnightContractZip(witnessData);

      expect(result.witnessCode).toContain('cjs: true');
    });

    it('should score definition files by content (Circuits, Ledger, Queries)', async () => {
      const scoringZip = new JSZip();
      scoringZip.file('contract/index.cjs', 'module.exports = {};');
      scoringZip.file('random.d.ts', 'export interface Random {}');
      scoringZip.file(
        'contract.d.ts',
        'export type Circuits = {}; export type Ledger = {}; export type Queries = {};'
      );
      const scoringData = await scoringZip.generateAsync({ type: 'base64' });

      const result = await extractMidnightContractZip(scoringData);

      expect(result.contractDefinition).toContain('Circuits');
      expect(result.contractDefinition).toContain('Ledger');
      expect(result.contractDefinition).toContain('Queries');
    });

    it('should append witness type definitions to contract definition', async () => {
      const witnessTypesZip = new JSZip();
      witnessTypesZip.file('contract/index.cjs', 'module.exports = {};');
      witnessTypesZip.file('contract/index.d.ts', 'export type Circuits = {};');
      witnessTypesZip.file('witnesses.d.ts', 'export type WitnessType = { test: boolean };');
      const witnessTypesData = await witnessTypesZip.generateAsync({ type: 'base64' });

      const result = await extractMidnightContractZip(witnessTypesData);

      expect(result.contractDefinition).toContain('Circuits');
      expect(result.contractDefinition).toContain('WitnessType');
    });

    it('should handle missing witness code gracefully', async () => {
      const noWitnessZip = new JSZip();
      noWitnessZip.file('contract/index.cjs', 'module.exports = {};');
      noWitnessZip.file('contract/index.d.ts', 'export type Circuits = {};');
      const noWitnessData = await noWitnessZip.generateAsync({ type: 'base64' });

      const result = await extractMidnightContractZip(noWitnessData);

      expect(result.witnessCode).toBeUndefined();
    });

    it('should handle ZK artifacts without zkir files', async () => {
      const noZkirZip = new JSZip();
      noZkirZip.file('contract/index.cjs', 'module.exports = {};');
      noZkirZip.file('contract/index.d.ts', 'export type Circuits = {};');
      noZkirZip.file('keys/test.prover', new Uint8Array([1, 2, 3]));
      noZkirZip.file('keys/test.verifier', new Uint8Array([4, 5, 6]));
      const noZkirData = await noZkirZip.generateAsync({ type: 'base64' });

      const result = await extractMidnightContractZip(noZkirData);

      expect(result.zkArtifacts?.test).toBeDefined();
      expect(result.zkArtifacts?.test.zkir).toBeUndefined();
    });

    it('should skip prover files without matching verifier', async () => {
      const mismatchZip = new JSZip();
      mismatchZip.file('contract/index.cjs', 'module.exports = {};');
      mismatchZip.file('contract/index.d.ts', 'export type Circuits = {};');
      mismatchZip.file('keys/test.prover', new Uint8Array([1, 2, 3]));
      const mismatchData = await mismatchZip.generateAsync({ type: 'base64' });

      const result = await extractMidnightContractZip(mismatchData);

      expect(result.zkArtifacts).toBeUndefined();
    });

    it('should extract legacy verifier keys as objects', async () => {
      const legacyZip = new JSZip();
      legacyZip.file('contract/index.cjs', 'module.exports = {};');
      legacyZip.file('contract/index.d.ts', 'export type Circuits = {};');
      legacyZip.file('keys/test.verifier', JSON.stringify({ legacy: 'verifier' }));
      const legacyData = await legacyZip.generateAsync({ type: 'base64' });

      const result = await extractMidnightContractZip(legacyData);

      expect(result.verifierKeys?.test).toEqual({ legacy: 'verifier' });
    });

    it('should handle multiple levels of re-exports', async () => {
      const deepReExportZip = new JSZip();
      deepReExportZip.file('contract/index.cjs', 'module.exports = {};');
      deepReExportZip.file('contract/index.d.ts', 'export * from "./intermediate";');
      deepReExportZip.file('contract/intermediate.d.ts', 'export * from "./types";');
      deepReExportZip.file('contract/types.d.ts', 'export type Circuits = {};');
      const deepReExportData = await deepReExportZip.generateAsync({ type: 'base64' });

      const result = await extractMidnightContractZip(deepReExportData);

      expect(result.contractDefinition).toContain('Circuits');
    });

    it('should handle re-exports with .cjs extensions', async () => {
      const cjsReExportZip = new JSZip();
      cjsReExportZip.file('contract/index.cjs', 'module.exports = {};');
      cjsReExportZip.file('contract/index.d.cts', 'export * from "./types.cjs";');
      cjsReExportZip.file('contract/types.d.cts', 'export type Circuits = {};');
      const cjsReExportData = await cjsReExportZip.generateAsync({ type: 'base64' });

      const result = await extractMidnightContractZip(cjsReExportData);

      expect(result.contractDefinition).toContain('Circuits');
    });

    it('should throw error for completely invalid ZIP data', async () => {
      await expect(extractMidnightContractZip('not-valid-base64-zip-data')).rejects.toThrow();
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
