import type { xdr } from '@stellar/stellar-sdk';
import { describe, expect, it, vi } from 'vitest';

const fetchSacSpecJsonMock = vi.fn(async () => '[{"mock":true}]');
const encodeSacSpecEntriesMock = vi.fn(async () => ['encoded-entry']);

vi.mock('../../src/sac/spec-source', async () => {
  const actual = await vi.importActual<typeof import('../../src/sac/spec-source')>(
    '../../src/sac/spec-source'
  );
  return {
    ...actual,
    fetchSacSpecJson: fetchSacSpecJsonMock,
  };
});

vi.mock('../../src/sac/xdr', async () => {
  const actual = await vi.importActual<typeof import('../../src/sac/xdr')>('../../src/sac/xdr');
  return {
    ...actual,
    encodeSacSpecEntries: encodeSacSpecEntriesMock,
    toScSpecEntries: vi.fn(() => [{ fromXDR: true } as unknown as xdr.ScSpecEntry]),
  };
});

describe('sac/spec-cache', () => {
  it('avoids refetching SAC spec on second load (Query defaults)', async () => {
    const { getSacSpecArtifacts, clearSacSpecArtifactsCache } = await import(
      '../../src/sac/spec-cache'
    );

    clearSacSpecArtifactsCache();
    const first = await getSacSpecArtifacts();
    const second = await getSacSpecArtifacts();

    expect(first).toBe(second);
    expect(fetchSacSpecJsonMock).toHaveBeenCalledTimes(1);
    expect(encodeSacSpecEntriesMock).toHaveBeenCalledTimes(1);
  });
});
