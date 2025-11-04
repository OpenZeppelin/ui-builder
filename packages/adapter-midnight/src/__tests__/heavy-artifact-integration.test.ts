import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import { MidnightAdapter } from '../adapter';
import { stripZipForFunction } from '../utils/zip-slimmer';

const mockNetworkConfig = {
  id: 'midnight-testnet',
  name: 'Midnight Testnet',
  ecosystem: 'midnight' as const,
  network: 'midnight',
  type: 'testnet' as const,
  isTestnet: true,
  exportConstName: 'midnightTestnet',
  networkId: { 2: 'TestNet' as const },
};

describe('MidnightAdapter - Heavy Artifact Handling Integration', () => {
  describe('getArtifactPersistencePolicy', () => {
    it('should return deferred policy with 15MB threshold', () => {
      const adapter = new MidnightAdapter(mockNetworkConfig);
      const policy = adapter.getArtifactPersistencePolicy();

      expect(policy).toBeDefined();
      expect(policy?.mode).toBe('deferredUntilFunctionSelected');
      expect(policy?.sizeThresholdBytes).toBe(15 * 1024 * 1024);
    });
  });

  describe('prepareArtifactsForFunction', () => {
    it('should trim artifacts and return persistable data', async () => {
      const adapter = new MidnightAdapter(mockNetworkConfig);

      // Create a mock ZIP with multiple circuits
      const zip = new JSZip();
      zip.file('contract/index.cjs', 'module.exports = {}');
      zip.file('contract/index.d.ts', 'export type Circuits = {};');
      zip.file('witnesses.js', 'export const witnesses = {}');
      zip.file('keys/increment.prover', new Uint8Array([1, 2, 3]));
      zip.file('keys/increment.verifier', new Uint8Array([4, 5, 6]));
      zip.file('zkir/increment.bzkir', new Uint8Array([7, 8, 9]));
      zip.file('keys/decrement.prover', new Uint8Array([10, 11, 12]));
      zip.file('keys/decrement.verifier', new Uint8Array([13, 14, 15]));
      zip.file('zkir/decrement.bzkir', new Uint8Array([16, 17, 18]));

      const originalZip = await zip.generateAsync({ type: 'uint8array' });
      const base64Zip = Buffer.from(originalZip).toString('base64');

      const currentArtifacts = {
        contractAddress: '0x123',
        privateStateId: 'test-state',
        contractModule: 'module.exports = {}',
        contractDefinition: 'export type Circuits = {};',
        witnessCode: 'export const witnesses = {}',
        originalZipData: base64Zip,
      };

      const result = await adapter.prepareArtifactsForFunction({
        functionId: 'increment',
        currentArtifacts,
      });

      expect(result.persistableArtifacts).toBeDefined();
      expect(result.persistableArtifacts?.privateStateId).toBe('test-state');
      expect(result.persistableArtifacts?.contractModule).toBe('module.exports = {}');
      expect(result.persistableArtifacts?.contractDefinition).toBe('export type Circuits = {};');
      expect(result.persistableArtifacts?.witnessCode).toBe('export const witnesses = {}');
      expect(result.persistableArtifacts?.trimmedZipBase64).toBeDefined();
      expect(result.persistableArtifacts?.originalZipData).toBeUndefined(); // Should not persist original

      expect(result.publicAssets).toBeDefined();
      expect(result.publicAssets?.['public/midnight/contract.zip']).toBeDefined();

      expect(result.bootstrapSource).toBeDefined();
      expect(result.bootstrapSource?.contractAddress).toBe('0x123');
      expect(result.bootstrapSource?.privateStateId).toBe('test-state');
      expect(result.bootstrapSource?.contractArtifactsUrl).toBe('/midnight/contract.zip');
    });

    it('should handle missing ZIP gracefully', async () => {
      const adapter = new MidnightAdapter(mockNetworkConfig);

      const currentArtifacts = {
        contractAddress: '0x123',
        privateStateId: 'test-state',
        contractModule: 'module.exports = {}',
        contractDefinition: 'export type Circuits = {};',
        witnessCode: 'export const witnesses = {}',
        // No originalZipData
      };

      const result = await adapter.prepareArtifactsForFunction({
        functionId: 'increment',
        currentArtifacts,
      });

      expect(result.persistableArtifacts).toBeDefined();
      expect(result.persistableArtifacts?.privateStateId).toBe('test-state');
      expect(result.persistableArtifacts?.contractModule).toBe('module.exports = {}');
      expect(result.persistableArtifacts?.contractDefinition).toBe('export type Circuits = {};');
      expect(result.publicAssets).toBeUndefined();
    });

    it('should handle trimming errors gracefully', async () => {
      const adapter = new MidnightAdapter(mockNetworkConfig);

      const currentArtifacts = {
        contractAddress: '0x123',
        privateStateId: 'test-state',
        contractModule: 'module.exports = {}',
        contractDefinition: 'export type Circuits = {};',
        witnessCode: 'export const witnesses = {}',
        originalZipData: 'invalid-base64',
      };

      const result = await adapter.prepareArtifactsForFunction({
        functionId: 'increment',
        currentArtifacts,
      });

      // Should fallback to small artifacts only
      expect(result.persistableArtifacts).toBeDefined();
      expect(result.persistableArtifacts?.privateStateId).toBe('test-state');
      expect(result.persistableArtifacts?.contractDefinition).toBe('export type Circuits = {};');
      expect(result.persistableArtifacts?.trimmedZipBase64).toBeUndefined();
    });
  });

  describe('Export flow with trimmed artifacts', () => {
    it('should produce smaller ZIP after trimming', async () => {
      // Create a realistic multi-circuit ZIP
      const zip = new JSZip();
      zip.file('contract/index.cjs', 'module.exports = {}');
      zip.file('contract/index.d.ts', 'export type Circuits = {};');
      zip.file('witnesses.js', 'export const witnesses = {}');

      // Add multiple large circuits
      const largeData = new Uint8Array(10000).fill(0);
      for (const circuit of ['circuit1', 'circuit2', 'circuit3']) {
        zip.file(`keys/${circuit}.prover`, largeData);
        zip.file(`keys/${circuit}.verifier`, largeData);
        zip.file(`zkir/${circuit}.bzkir`, largeData);
      }

      const originalZip = await zip.generateAsync({ type: 'uint8array' });
      const trimmed = await stripZipForFunction(originalZip, 'circuit1');

      // Trimmed should be significantly smaller (only 1 circuit instead of 3)
      expect(trimmed.length).toBeLessThan(originalZip.length / 2);

      // Verify trimmed contains only circuit1 artifacts
      const trimmedZip = await JSZip.loadAsync(trimmed);
      const files = Object.keys(trimmedZip.files);

      expect(files).toContain('keys/circuit1.prover');
      expect(files).toContain('keys/circuit1.verifier');
      expect(files).toContain('zkir/circuit1.bzkir');

      expect(files).not.toContain('keys/circuit2.prover');
      expect(files).not.toContain('keys/circuit3.prover');
    });
  });
});
