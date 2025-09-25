import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// T005: Unit test for SAC spec fetch + XDR encode

const loggerErrorMock = vi.fn();

vi.mock('../../src/sac/spec-source', async () => {
  const actual = await vi.importActual<typeof import('../../src/sac/spec-source')>(
    '../../src/sac/spec-source'
  );
  return {
    ...actual,
    getSacSpecUrl: (cfg?: { path?: string }) => `https://example.com/${cfg?.path ?? 'main'}`,
  };
});

vi.mock('@openzeppelin/ui-builder-utils', () => ({
  logger: {
    error: loggerErrorMock,
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@stellar/stellar-xdr-json', () => {
  return {
    default: vi.fn(() => Promise.resolve()),
    encode: vi.fn((type, data) => `encoded:${data}`),
  };
});

vi.mock('lossless-json', () => ({
  parse: vi.fn((str) => JSON.parse(str)),
  stringify: vi.fn((obj) => JSON.stringify(obj)),
}));

let fetchMock: ReturnType<typeof vi.fn>;

const createMockResponse = (ok: boolean, body?: string, status = 200) => ({
  ok,
  status,
  text: () => Promise.resolve(body ?? ''),
});

describe('sac/spec-encoding', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches official SAC spec and encodes to XDR entries', async () => {
    const mockJson = JSON.stringify([
      {
        function_v0: {
          name: 'balance',
          doc: 'Get balance',
          inputs: [{ name: 'id', type_: 'address', doc: '' }],
          outputs: ['i128'],
        },
      },
    ]);
    fetchMock.mockResolvedValue(createMockResponse(true, mockJson));

    const { fetchSacSpecJson } = await import('../../src/sac/spec-source');
    const { encodeSacSpecEntries } = await import('../../src/sac/xdr');

    const json = await fetchSacSpecJson();
    const encoded = await encodeSacSpecEntries(json);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(encoded.length).toBeGreaterThan(0);
    expect(encoded[0]).toMatch(/^encoded:/); // Check our mock was called
  });

  it('surfaces a friendly error when fetch fails', async () => {
    fetchMock.mockResolvedValue(createMockResponse(false, undefined, 500));

    const { fetchSacSpecJson } = await import('../../src/sac/spec-source');

    await expect(fetchSacSpecJson()).rejects.toThrow(
      'Failed to load Stellar Asset Contract spec. Please try again later.'
    );
    expect(loggerErrorMock).toHaveBeenCalled();
  });
});
