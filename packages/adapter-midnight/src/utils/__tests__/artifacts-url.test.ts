import JSZip from 'jszip';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { validateAndConvertMidnightArtifacts } from '../artifacts';
import * as zipExtractor from '../zip-extractor';

// Mock the global fetch
global.fetch = vi.fn();

describe('validateAndConvertMidnightArtifacts - URL loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and extract ZIP from URL', async () => {
    // Create a mock ZIP
    const zip = new JSZip();
    zip.file('contract/index.cjs', 'module.exports = {}');
    zip.file('contract/index.d.ts', 'export type Circuits = {};');
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Mock fetch to return the ZIP
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      blob: async () => zipBlob,
    });

    // Mock the ZIP extractor
    vi.spyOn(zipExtractor, 'extractMidnightContractZip').mockResolvedValue({
      contractDefinition: 'export type Circuits = {};',
      contractModule: 'module.exports = {}',
    });

    const source = {
      contractArtifactsUrl: '/midnight/contract.zip',
      contractAddress: '0x123',
      privateStateId: 'test-state',
    };

    const result = await validateAndConvertMidnightArtifacts(source);

    expect(global.fetch).toHaveBeenCalledWith('/midnight/contract.zip');
    expect(result.contractAddress).toBe('0x123');
    expect(result.privateStateId).toBe('test-state');
    expect(result.contractDefinition).toBe('export type Circuits = {};');
    expect(result.contractModule).toBe('module.exports = {}');
    expect(result.originalZipData).toBeUndefined(); // Should not store for URL loads
  });

  it('should throw error if fetch fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const source = {
      contractArtifactsUrl: '/midnight/contract.zip',
      contractAddress: '0x123',
      privateStateId: 'test-state',
    };

    await expect(validateAndConvertMidnightArtifacts(source)).rejects.toThrow(
      'Failed to fetch artifacts ZIP'
    );
  });

  it('should throw error if required fields are missing', async () => {
    const zip = new JSZip();
    zip.file('contract/index.cjs', 'module.exports = {}');
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      blob: async () => zipBlob,
    });

    vi.spyOn(zipExtractor, 'extractMidnightContractZip').mockResolvedValue({
      contractDefinition: 'export type Circuits = {};',
      contractModule: 'module.exports = {}',
    });

    const source = {
      contractArtifactsUrl: '/midnight/contract.zip',
      // Missing contractAddress and privateStateId
    };

    await expect(validateAndConvertMidnightArtifacts(source)).rejects.toThrow(
      'Contract address and private state ID are required'
    );
  });
});
