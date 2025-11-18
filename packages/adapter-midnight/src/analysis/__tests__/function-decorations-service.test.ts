import { beforeEach, describe, expect, it, vi } from 'vitest';

import { evaluateContractModule } from '../../transaction/contract-evaluator';
import { evaluateWitnessCode } from '../../transaction/witness-evaluator';
import type { MidnightContractArtifacts } from '../../types';
import { FunctionDecorationsService } from '../function-decorations-service';
import { detectOrganizerOnlyBySource } from '../organizer-only-detector';

// Mock the dependencies
vi.mock('../organizer-only-detector', () => ({
  detectOrganizerOnlyBySource: vi.fn(),
}));

vi.mock('../../transaction/contract-evaluator', () => ({
  evaluateContractModule: vi.fn(),
}));

vi.mock('../../transaction/witness-evaluator', () => ({
  evaluateWitnessCode: vi.fn(),
}));

vi.mock('@midnight-ntwrk/compact-runtime', () => ({
  default: { versionString: '0.9.0' },
}));

describe('FunctionDecorationsService', () => {
  let service: FunctionDecorationsService;

  beforeEach(() => {
    service = new FunctionDecorationsService();
    vi.clearAllMocks();
  });

  describe('analyzeFunctionDecorations', () => {
    it('should return undefined when no artifacts provided', async () => {
      const result = await service.analyzeFunctionDecorations(null);
      expect(result).toBeUndefined();
    });

    it('should analyze artifacts and return function decorations', async () => {
      const artifacts: MidnightContractArtifacts = {
        contractAddress: '0x123',
        privateStateId: 'test_v1',
        contractDefinition: '',
        contractModule: 'contract code',
        witnessCode: 'witness code',
        verifierKeys: { setName: new Uint8Array() },
      };

      const baseWitnesses = { local_sk: () => {} };
      const contractInstance = {
        impureCircuits: {
          setName: function () {},
          getName: function () {},
        },
      };

      const detectionResults = {
        setName: true,
        getName: false,
      };

      vi.mocked(evaluateWitnessCode).mockReturnValue(baseWitnesses);
      vi.mocked(evaluateContractModule).mockReturnValue(contractInstance);
      vi.mocked(detectOrganizerOnlyBySource).mockReturnValue(detectionResults);

      const result = await service.analyzeFunctionDecorations(artifacts);

      expect(result).toBeDefined();
      expect(result?.setName).toBeDefined();
      expect(result?.setName?.badges).toHaveLength(1);
      expect(result?.setName?.badges?.[0].text).toBe('Identity-restricted');
      expect(result?.setName?.requiresRuntimeSecret).toBe(true);
      expect(result?.getName).toBeUndefined();
    });

    it('should cache results based on artifact properties', async () => {
      const artifacts: MidnightContractArtifacts = {
        contractAddress: '0x123',
        privateStateId: 'test_v1',
        contractDefinition: '',
        contractModule: 'contract code',
        witnessCode: 'witness code',
        verifierKeys: { setName: new Uint8Array() },
      };

      const baseWitnesses = { local_sk: () => {} };
      const contractInstance = {
        impureCircuits: { setName: function () {} },
      };

      const detectionResults = { setName: true };

      vi.mocked(evaluateWitnessCode).mockReturnValue(baseWitnesses);
      vi.mocked(evaluateContractModule).mockReturnValue(contractInstance);
      vi.mocked(detectOrganizerOnlyBySource).mockReturnValue(detectionResults);

      // First call
      const result1 = await service.analyzeFunctionDecorations(artifacts);

      // Reset mocks to ensure they're not called again
      vi.clearAllMocks();

      // Second call with same artifacts
      const result2 = await service.analyzeFunctionDecorations(artifacts);

      // Results should be identical (from cache)
      expect(result1).toEqual(result2);
      // Detection functions should not be called on second call
      expect(evaluateWitnessCode).not.toHaveBeenCalled();
      expect(evaluateContractModule).not.toHaveBeenCalled();
      expect(detectOrganizerOnlyBySource).not.toHaveBeenCalled();
    });

    it('should return different results for different artifacts', async () => {
      const artifacts1: MidnightContractArtifacts = {
        contractAddress: '0x123',
        privateStateId: 'v1',
        contractDefinition: '',
        contractModule: 'code1',
        witnessCode: 'witness1',
        verifierKeys: {},
      };

      const artifacts2: MidnightContractArtifacts = {
        contractAddress: '0x456',
        privateStateId: 'v2',
        contractDefinition: '',
        contractModule: 'code2',
        witnessCode: 'witness2',
        verifierKeys: {},
      };

      const detectionResults1 = { setName: true };
      const detectionResults2 = { updateValue: true };

      vi.mocked(evaluateWitnessCode).mockReturnValue({ local_sk: () => {} });

      // First call - with setName circuit
      vi.mocked(evaluateContractModule).mockReturnValueOnce({
        impureCircuits: { setName: function () {} },
      });
      vi.mocked(detectOrganizerOnlyBySource).mockReturnValueOnce(detectionResults1);
      const result1 = await service.analyzeFunctionDecorations(artifacts1);

      // Second call - with updateValue circuit
      vi.mocked(evaluateContractModule).mockReturnValueOnce({
        impureCircuits: { updateValue: function () {} },
      });
      vi.mocked(detectOrganizerOnlyBySource).mockReturnValueOnce(detectionResults2);
      const result2 = await service.analyzeFunctionDecorations(artifacts2);

      expect(result1?.setName).toBeDefined();
      expect(result2?.updateValue).toBeDefined();
      expect(result1?.updateValue).toBeUndefined();
      expect(result2?.setName).toBeUndefined();
    });

    it('should handle detection errors gracefully', async () => {
      const artifacts: MidnightContractArtifacts = {
        contractAddress: '0x123',
        privateStateId: 'test_v1',
        contractDefinition: '',
        contractModule: 'contract code',
        witnessCode: 'witness code',
        verifierKeys: {},
      };

      vi.mocked(evaluateWitnessCode).mockImplementation(() => {
        throw new Error('Witness evaluation failed');
      });

      const result = await service.analyzeFunctionDecorations(artifacts);

      expect(result).toBeUndefined();
    });

    it('should handle missing contract instance gracefully', async () => {
      const artifacts: MidnightContractArtifacts = {
        contractAddress: '0x123',
        privateStateId: 'test_v1',
        contractDefinition: '',
        contractModule: 'contract code',
        witnessCode: 'witness code',
        verifierKeys: {},
      };

      vi.mocked(evaluateWitnessCode).mockReturnValue({ local_sk: () => {} });
      vi.mocked(evaluateContractModule).mockReturnValue(null);

      const result = await service.analyzeFunctionDecorations(artifacts);

      expect(result).toEqual({});
    });

    it('should handle empty impure circuits gracefully', async () => {
      const artifacts: MidnightContractArtifacts = {
        contractAddress: '0x123',
        privateStateId: 'test_v1',
        contractDefinition: '',
        contractModule: 'contract code',
        witnessCode: 'witness code',
        verifierKeys: {},
      };

      const contractInstance = {
        impureCircuits: {},
      };

      vi.mocked(evaluateWitnessCode).mockReturnValue({ local_sk: () => {} });
      vi.mocked(evaluateContractModule).mockReturnValue(contractInstance);

      const result = await service.analyzeFunctionDecorations(artifacts);

      expect(result).toEqual({});
    });
  });

  describe('clearCache', () => {
    it('should clear cached decorations', async () => {
      const artifacts: MidnightContractArtifacts = {
        contractAddress: '0x123',
        privateStateId: 'test_v1',
        contractDefinition: '',
        contractModule: 'contract code',
        witnessCode: 'witness code',
        verifierKeys: {},
      };

      const baseWitnesses = { local_sk: () => {} };
      const contractInstance = {
        impureCircuits: { setName: function () {} },
      };

      vi.mocked(evaluateWitnessCode).mockReturnValue(baseWitnesses);
      vi.mocked(evaluateContractModule).mockReturnValue(contractInstance);
      vi.mocked(detectOrganizerOnlyBySource).mockReturnValue({ setName: true });

      // First call
      await service.analyzeFunctionDecorations(artifacts);

      // Clear cache
      service.clearCache();

      // Reset mocks
      vi.clearAllMocks();
      vi.mocked(evaluateWitnessCode).mockReturnValue(baseWitnesses);
      vi.mocked(evaluateContractModule).mockReturnValue(contractInstance);
      vi.mocked(detectOrganizerOnlyBySource).mockReturnValue({ setName: true });

      // Second call should trigger detection again
      await service.analyzeFunctionDecorations(artifacts);

      expect(evaluateWitnessCode).toHaveBeenCalled();
      expect(evaluateContractModule).toHaveBeenCalled();
      expect(detectOrganizerOnlyBySource).toHaveBeenCalled();
    });
  });

  describe('decoration mapping', () => {
    it('should create proper badge for organizer-only circuits', async () => {
      const artifacts: MidnightContractArtifacts = {
        contractAddress: '0x123',
        privateStateId: 'test_v1',
        contractDefinition: '',
        contractModule: 'code',
        witnessCode: 'witness',
        verifierKeys: {},
      };

      vi.mocked(evaluateWitnessCode).mockReturnValue({ local_sk: () => {} });
      vi.mocked(evaluateContractModule).mockReturnValue({
        impureCircuits: { setName: function () {} },
      });
      vi.mocked(detectOrganizerOnlyBySource).mockReturnValue({ setName: true });

      const result = await service.analyzeFunctionDecorations(artifacts);

      const badge = result?.setName?.badges?.[0];
      expect(badge?.text).toBe('Identity-restricted');
      expect(badge?.variant).toBe('warning');
      expect(badge?.tooltip).toContain('code analysis');
    });

    it('should create proper note for organizer-only circuits', async () => {
      const artifacts: MidnightContractArtifacts = {
        contractAddress: '0x123',
        privateStateId: 'test_v1',
        contractDefinition: '',
        contractModule: 'code',
        witnessCode: 'witness',
        verifierKeys: {},
      };

      vi.mocked(evaluateWitnessCode).mockReturnValue({ local_sk: () => {} });
      vi.mocked(evaluateContractModule).mockReturnValue({
        impureCircuits: { setName: function () {} },
      });
      vi.mocked(detectOrganizerOnlyBySource).mockReturnValue({ setName: true });

      const result = await service.analyzeFunctionDecorations(artifacts);

      const note = result?.setName?.note;
      expect(note?.title).toContain('Identity-restricted');
      expect(note?.body).toContain('identity secret');
      expect(note?.body).toContain('static code analysis');
    });
  });
});
