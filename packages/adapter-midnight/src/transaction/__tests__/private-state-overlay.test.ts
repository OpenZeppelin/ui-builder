import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPrivateStateOverlay } from '../eoa';

describe('createPrivateStateOverlay', () => {
  let baseProvider: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    baseProvider = {
      get: vi.fn(),
      set: vi.fn(),
    };
  });

  describe('read operations', () => {
    it('should inject runtime organizer key into retrieved state', async () => {
      const persistedState = {
        someField: 'value',
        anotherField: 123,
      };

      baseProvider.get.mockResolvedValue(persistedState);

      const runtimeKey = 'abcd1234';
      const overlay = createPrivateStateOverlay(baseProvider, runtimeKey);

      const result = (await overlay.get('test-id')) as Record<string, unknown>;

      expect(result.someField).toBe('value');
      expect(result.anotherField).toBe(123);
      expect(result.organizerSecretKey).toBeInstanceOf(Uint8Array);
      expect(result.organizerSecretKey).toEqual(new Uint8Array([0xab, 0xcd, 0x12, 0x34]));
    });

    it('should strip any persisted organizerSecretKey before injecting runtime key', async () => {
      const persistedState = {
        someField: 'value',
        organizerSecretKey: new Uint8Array([0xff, 0xff]), // Old/invalid key
      };

      baseProvider.get.mockResolvedValue(persistedState);

      const runtimeKey = 'abcd1234';
      const overlay = createPrivateStateOverlay(baseProvider, runtimeKey);

      const result = (await overlay.get('test-id')) as Record<string, unknown>;

      expect(result.someField).toBe('value');
      expect(result.organizerSecretKey).toEqual(new Uint8Array([0xab, 0xcd, 0x12, 0x34]));
      expect(result.organizerSecretKey).not.toEqual(new Uint8Array([0xff, 0xff]));
    });

    it('should return sanitized state when no runtime key provided', async () => {
      const persistedState = {
        someField: 'value',
        organizerSecretKey: new Uint8Array([1, 2, 3]),
      };

      baseProvider.get.mockResolvedValue(persistedState);

      const overlay = createPrivateStateOverlay(baseProvider); // No runtime key

      const result = (await overlay.get('test-id')) as Record<string, unknown>;

      expect(result).toEqual({ someField: 'value' });
      expect(result.organizerSecretKey).toBeUndefined();
    });

    it('should return empty object when state only contained organizerSecretKey', async () => {
      const persistedState = {
        organizerSecretKey: new Uint8Array([1, 2, 3]),
      };

      baseProvider.get.mockResolvedValue(persistedState);

      const overlay = createPrivateStateOverlay(baseProvider);

      const result = await overlay.get('test-id');

      // Returns empty object instead of null (circuits need at least {} to work)
      expect(result).toEqual({});
    });

    it('should handle null base state with runtime key', async () => {
      baseProvider.get.mockResolvedValue(null);

      const runtimeKey = 'abcd1234';
      const overlay = createPrivateStateOverlay(baseProvider, runtimeKey);

      const result = (await overlay.get('test-id')) as Record<string, unknown>;

      expect(result).toEqual({
        organizerSecretKey: new Uint8Array([0xab, 0xcd, 0x12, 0x34]),
      });
    });

    it('should handle undefined base state', async () => {
      baseProvider.get.mockResolvedValue(undefined);

      const overlay = createPrivateStateOverlay(baseProvider);

      const result = await overlay.get('test-id');

      // Returns empty object instead of null (circuits need at least {} to work)
      expect(result).toEqual({});
    });

    it('should accept hex key with 0x prefix', async () => {
      baseProvider.get.mockResolvedValue({});

      const runtimeKey = '0xabcd1234';
      const overlay = createPrivateStateOverlay(baseProvider, runtimeKey);

      const result = (await overlay.get('test-id')) as Record<string, unknown>;

      expect(result.organizerSecretKey).toEqual(new Uint8Array([0xab, 0xcd, 0x12, 0x34]));
    });

    it('should handle uppercase hex', async () => {
      baseProvider.get.mockResolvedValue({});

      const runtimeKey = 'ABCD1234';
      const overlay = createPrivateStateOverlay(baseProvider, runtimeKey);

      const result = (await overlay.get('test-id')) as Record<string, unknown>;

      expect(result.organizerSecretKey).toEqual(new Uint8Array([0xab, 0xcd, 0x12, 0x34]));
    });
  });

  describe('write operations', () => {
    it('should strip organizerSecretKey before persisting', async () => {
      baseProvider.set.mockResolvedValue(undefined);

      const overlay = createPrivateStateOverlay(baseProvider);

      const stateWithKey = {
        someField: 'value',
        anotherField: 123,
        organizerSecretKey: new Uint8Array([0xab, 0xcd, 0x12, 0x34]),
      };

      await overlay.set('test-id', stateWithKey);

      expect(baseProvider.set).toHaveBeenCalledWith('test-id', {
        someField: 'value',
        anotherField: 123,
      });
    });

    it('should persist state without organizerSecretKey as-is', async () => {
      baseProvider.set.mockResolvedValue(undefined);

      const overlay = createPrivateStateOverlay(baseProvider);

      const stateWithoutKey = {
        someField: 'value',
        anotherField: 123,
      };

      await overlay.set('test-id', stateWithoutKey);

      expect(baseProvider.set).toHaveBeenCalledWith('test-id', stateWithoutKey);
    });

    it('should handle null state writes', async () => {
      baseProvider.set.mockResolvedValue(undefined);

      const overlay = createPrivateStateOverlay(baseProvider);

      await overlay.set('test-id', null);

      expect(baseProvider.set).toHaveBeenCalledWith('test-id', null);
    });

    it('should handle undefined state writes', async () => {
      baseProvider.set.mockResolvedValue(undefined);

      const overlay = createPrivateStateOverlay(baseProvider);

      await overlay.set('test-id', undefined);

      expect(baseProvider.set).toHaveBeenCalledWith('test-id', undefined);
    });

    it('should never persist runtime key across multiple writes', async () => {
      baseProvider.set.mockResolvedValue(undefined);

      const runtimeKey = 'abcd1234';
      const overlay = createPrivateStateOverlay(baseProvider, runtimeKey);

      const state1 = {
        field1: 'value1',
        organizerSecretKey: new Uint8Array([1, 2, 3]),
      };

      const state2 = {
        field2: 'value2',
        organizerSecretKey: new Uint8Array([4, 5, 6]),
      };

      await overlay.set('id1', state1);
      await overlay.set('id2', state2);

      expect(baseProvider.set).toHaveBeenCalledTimes(2);
      expect(baseProvider.set).toHaveBeenNthCalledWith(1, 'id1', { field1: 'value1' });
      expect(baseProvider.set).toHaveBeenNthCalledWith(2, 'id2', { field2: 'value2' });
    });
  });

  describe('error handling', () => {
    it('should handle invalid hex gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const invalidKey = 'not-valid-hex';
      const overlay = createPrivateStateOverlay(baseProvider, invalidKey);

      baseProvider.get.mockResolvedValue({ someField: 'value' });

      const result = (await overlay.get('test-id')) as Record<string, unknown>;

      // Key should not be injected due to invalid hex
      expect(result.organizerSecretKey).toBeUndefined();
      expect(result).toEqual({ someField: 'value' });

      consoleWarnSpy.mockRestore();
    });

    it('should handle odd-length hex gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const invalidKey = 'abc'; // Odd length
      const overlay = createPrivateStateOverlay(baseProvider, invalidKey);

      baseProvider.get.mockResolvedValue({});

      const result = await overlay.get('test-id');

      // Empty object returns {} when no runtime key is valid (circuits need at least {} to work)
      expect(result).toEqual({});

      consoleWarnSpy.mockRestore();
    });

    it('should handle empty hex string', async () => {
      baseProvider.get.mockResolvedValue({});

      const overlay = createPrivateStateOverlay(baseProvider, '');

      const result = await overlay.get('test-id');

      // Empty object with no runtime key returns {} (circuits need at least {} to work)
      expect(result).toEqual({});
    });
  });

  describe('runtime key immutability', () => {
    it('should not allow runtime key to be persisted even if included in writes', async () => {
      baseProvider.set.mockResolvedValue(undefined);

      const runtimeKey = 'abcd1234';
      const overlay = createPrivateStateOverlay(baseProvider, runtimeKey);

      // Attempt to write with organizerSecretKey matching runtime key
      const attemptedState = {
        someField: 'value',
        organizerSecretKey: new Uint8Array([0xab, 0xcd, 0x12, 0x34]),
      };

      await overlay.set('test-id', attemptedState);

      // Verify key was stripped
      expect(baseProvider.set).toHaveBeenCalledWith('test-id', {
        someField: 'value',
      });
    });

    it('should maintain runtime key across multiple reads', async () => {
      baseProvider.get.mockResolvedValue({ field: 'value' });

      const runtimeKey = 'abcd1234';
      const overlay = createPrivateStateOverlay(baseProvider, runtimeKey);

      const result1 = (await overlay.get('id1')) as Record<string, unknown>;
      const result2 = (await overlay.get('id2')) as Record<string, unknown>;

      expect(result1.organizerSecretKey).toEqual(new Uint8Array([0xab, 0xcd, 0x12, 0x34]));
      expect(result2.organizerSecretKey).toEqual(new Uint8Array([0xab, 0xcd, 0x12, 0x34]));
    });
  });
});
