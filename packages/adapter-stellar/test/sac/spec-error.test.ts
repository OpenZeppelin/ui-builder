import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@openzeppelin/ui-utils', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: false, status: 500 }))
  );
});

describe('sac/spec-error', () => {
  it('surfaces a user-friendly error when spec fetch fails', async () => {
    const actual = await vi.importActual<typeof import('../../src/sac/spec-source')>(
      '../../src/sac/spec-source'
    );

    vi.doMock('../../src/sac/spec-source', () => ({
      ...actual,
      getSacSpecUrl: () => 'https://example.com/spec.json',
    }));

    const { fetchSacSpecJson } = await import('../../src/sac/spec-source');

    await expect(fetchSacSpecJson()).rejects.toThrow(
      'Failed to load Stellar Asset Contract spec. Please try again later.'
    );
  });
});
