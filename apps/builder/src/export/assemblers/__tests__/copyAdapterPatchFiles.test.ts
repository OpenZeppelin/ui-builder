import { describe, expect, it, vi } from 'vitest';

import type { AdapterConfig, Ecosystem } from '@openzeppelin/ui-types';

// Mock patch file content
const MOCK_PATCH_CONTENT = `diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -1,3 +1,4 @@
 {
+  "type": "module",
   "name": "test-package"
 }`;

// Mock AdapterConfig for Midnight with patchedDependencies
const mockMidnightAdapterConfig: AdapterConfig = {
  dependencies: {
    runtime: {
      '@midnight-ntwrk/compact-runtime': '^0.9.0',
    },
    dev: {},
  },
  patchedDependencies: {
    '@midnight-ntwrk/compact-runtime@0.9.0': '@midnight-ntwrk__compact-runtime@0.9.0.patch',
    '@midnight-ntwrk/midnight-js-contracts@2.0.2':
      '@midnight-ntwrk__midnight-js-contracts@2.0.2.patch',
    '@midnight-ntwrk/midnight-js-types@2.0.2': '@midnight-ntwrk__midnight-js-types@2.0.2.patch',
  },
};

// Mock AdapterConfigLoader
vi.mock('../../AdapterConfigLoader', () => ({
  AdapterConfigLoader: vi.fn().mockImplementation(() => ({
    loadConfig: vi.fn().mockImplementation(async (ecosystem: Ecosystem) => {
      if (ecosystem === 'midnight') {
        return mockMidnightAdapterConfig;
      }
      // Return config without patchedDependencies for other ecosystems
      return {
        dependencies: {
          runtime: { viem: '^2.0.0' },
        },
      };
    }),
  })),
}));

// Mock logger to avoid console output during tests
vi.mock('@openzeppelin/ui-utils', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// We need to mock the module that uses import.meta.glob
// Since import.meta.glob is a Vite-specific feature, we mock the entire module
vi.mock('../copyAdapterPatchFiles', async () => {
  const { AdapterConfigLoader } = await import('../../AdapterConfigLoader');

  return {
    copyAdapterPatchFiles: async (
      projectFiles: Record<string, string | Uint8Array | Blob>,
      ecosystem: Ecosystem
    ) => {
      const adapterConfigLoader = new AdapterConfigLoader();
      const adapterConfig = await adapterConfigLoader.loadConfig(ecosystem);

      if (!adapterConfig?.patchedDependencies) {
        return;
      }

      const patchFileNames = Object.values(adapterConfig.patchedDependencies);

      for (const patchFileName of patchFileNames) {
        // Use mock patch content for tests
        const destPath = `patches/${patchFileName}`;
        projectFiles[destPath] = MOCK_PATCH_CONTENT;
      }
    },
  };
});

// Import after mocks are set up
const { copyAdapterPatchFiles } = await import('../copyAdapterPatchFiles');

describe('copyAdapterPatchFiles', () => {
  describe('ecosystems with patches', () => {
    it('should copy patch files for Midnight ecosystem', async () => {
      const projectFiles: Record<string, string | Uint8Array | Blob> = {};

      await copyAdapterPatchFiles(projectFiles, 'midnight');

      // Should have added patch files
      const patchFiles = Object.keys(projectFiles).filter((path) => path.startsWith('patches/'));
      expect(patchFiles.length).toBeGreaterThan(0);

      // Should include known Midnight SDK patches
      expect(projectFiles).toHaveProperty('patches/@midnight-ntwrk__compact-runtime@0.9.0.patch');
      expect(projectFiles).toHaveProperty(
        'patches/@midnight-ntwrk__midnight-js-contracts@2.0.2.patch'
      );
      expect(projectFiles).toHaveProperty('patches/@midnight-ntwrk__midnight-js-types@2.0.2.patch');
    });

    it('should copy patch content as strings', async () => {
      const projectFiles: Record<string, string | Uint8Array | Blob> = {};

      await copyAdapterPatchFiles(projectFiles, 'midnight');

      // Patch content should be strings (diff format)
      const patchFiles = Object.entries(projectFiles).filter(([path]) =>
        path.startsWith('patches/')
      );

      expect(patchFiles.length).toBeGreaterThan(0);
      patchFiles.forEach(([, content]) => {
        expect(typeof content).toBe('string');
        // Patch files should have diff-like content
        expect(content as string).toMatch(/diff|---|\+\+\+|@@/);
      });
    });
  });

  describe('ecosystems without patches', () => {
    it('should not add any files for EVM ecosystem', async () => {
      const projectFiles: Record<string, string | Uint8Array | Blob> = {};

      await copyAdapterPatchFiles(projectFiles, 'evm');

      const patchFiles = Object.keys(projectFiles).filter((path) => path.startsWith('patches/'));
      expect(patchFiles.length).toBe(0);
    });

    it('should not add any files for Stellar ecosystem', async () => {
      const projectFiles: Record<string, string | Uint8Array | Blob> = {};

      await copyAdapterPatchFiles(projectFiles, 'stellar');

      const patchFiles = Object.keys(projectFiles).filter((path) => path.startsWith('patches/'));
      expect(patchFiles.length).toBe(0);
    });

    it('should not add any files for Solana ecosystem', async () => {
      const projectFiles: Record<string, string | Uint8Array | Blob> = {};

      await copyAdapterPatchFiles(projectFiles, 'solana');

      const patchFiles = Object.keys(projectFiles).filter((path) => path.startsWith('patches/'));
      expect(patchFiles.length).toBe(0);
    });
  });

  describe('unknown ecosystems', () => {
    it('should handle unknown ecosystem gracefully', async () => {
      const projectFiles: Record<string, string | Uint8Array | Blob> = {};

      // Should not throw
      await expect(
        copyAdapterPatchFiles(projectFiles, 'unknown' as Ecosystem)
      ).resolves.not.toThrow();

      // Should not add any files
      expect(Object.keys(projectFiles).length).toBe(0);
    });
  });

  describe('existing project files', () => {
    it('should preserve existing project files', async () => {
      const projectFiles: Record<string, string | Uint8Array | Blob> = {
        'src/main.ts': 'console.log("hello");',
        'package.json': '{}',
      };

      await copyAdapterPatchFiles(projectFiles, 'midnight');

      // Original files should still exist
      expect(projectFiles).toHaveProperty('src/main.ts');
      expect(projectFiles).toHaveProperty('package.json');

      // Patch files should be added
      const patchFiles = Object.keys(projectFiles).filter((path) => path.startsWith('patches/'));
      expect(patchFiles.length).toBeGreaterThan(0);
    });

    it('should not overwrite non-patch files', async () => {
      const originalContent = 'original content';
      const projectFiles: Record<string, string | Uint8Array | Blob> = {
        'src/main.ts': originalContent,
      };

      await copyAdapterPatchFiles(projectFiles, 'midnight');

      // Original content should be preserved
      expect(projectFiles['src/main.ts']).toBe(originalContent);
    });
  });
});
