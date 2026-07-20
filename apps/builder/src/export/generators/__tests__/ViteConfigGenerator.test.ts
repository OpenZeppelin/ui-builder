import { describe, expect, it } from 'vitest';

import { ecosystemUsesWalletInterop, generateViteConfig } from '../ViteConfigGenerator';

describe('ViteConfigGenerator', () => {
  describe('ecosystemUsesWalletInterop', () => {
    it.each([
      ['evm', true],
      ['polkadot', true],
      ['stellar', false],
      ['solana', false],
      ['midnight', false],
    ] as const)('returns %s → %s', (ecosystem, expected) => {
      expect(ecosystemUsesWalletInterop(ecosystem)).toBe(expected);
    });
  });

  describe('generateViteConfig', () => {
    it('includes eventemitter3 alias and optimizeDeps for evm exports', () => {
      const config = generateViteConfig({ ecosystem: 'evm' });

      expect(config).toContain('eventemitter3CjsEntry');
      expect(config).toContain("include: ['eventemitter3']");
      expect(config).not.toContain("'debug'");
    });

    it('omits wallet interop for stellar exports', () => {
      const config = generateViteConfig({ ecosystem: 'stellar' });

      expect(config).not.toContain('eventemitter3CjsEntry');
      expect(config).not.toContain("'eventemitter3'");
      expect(config).not.toContain("'debug'");
    });
  });
});
