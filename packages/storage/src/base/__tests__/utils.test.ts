import { describe, expect, it } from 'vitest';

import { isQuotaError, withQuotaHandling } from '../utils';

describe('isQuotaError', () => {
  it('should return false for null/undefined', () => {
    expect(isQuotaError(null)).toBe(false);
    expect(isQuotaError(undefined)).toBe(false);
  });

  it('should return false for non-object values', () => {
    expect(isQuotaError('error')).toBe(false);
    expect(isQuotaError(123)).toBe(false);
    expect(isQuotaError(true)).toBe(false);
  });

  it('should detect QuotaExceededError by name', () => {
    const error = new Error('Storage full');
    error.name = 'QuotaExceededError';
    expect(isQuotaError(error)).toBe(true);
  });

  it('should detect Safari iOS quota error by code 22', () => {
    // Safari iOS uses code 22 for quota errors
    const error = { code: 22, message: 'Some error' };
    expect(isQuotaError(error)).toBe(true);
  });

  it('should detect quota error by message containing "quota"', () => {
    expect(isQuotaError(new Error('quota exceeded'))).toBe(true);
    expect(isQuotaError(new Error('Storage QUOTA limit reached'))).toBe(true);
    expect(isQuotaError({ message: 'The quota has been exceeded' })).toBe(true);
  });

  it('should return false for regular errors', () => {
    expect(isQuotaError(new Error('Network error'))).toBe(false);
    expect(isQuotaError(new Error('Permission denied'))).toBe(false);
    expect(isQuotaError({ code: 500, message: 'Server error' })).toBe(false);
  });

  it('should handle objects without expected properties', () => {
    expect(isQuotaError({})).toBe(false);
    expect(isQuotaError({ foo: 'bar' })).toBe(false);
    expect(isQuotaError({ name: 'TypeError' })).toBe(false);
  });
});

describe('withQuotaHandling', () => {
  it('should return the result of successful operations', async () => {
    const result = await withQuotaHandling('testTable', async () => 'success');
    expect(result).toBe('success');
  });

  it('should pass through the return value of async operations', async () => {
    const data = { id: '123', name: 'test' };
    const result = await withQuotaHandling('testTable', async () => data);
    expect(result).toEqual(data);
  });

  it('should convert quota errors to standardized format', async () => {
    const quotaError = new Error('Storage full');
    quotaError.name = 'QuotaExceededError';

    await expect(
      withQuotaHandling('myTable', async () => {
        throw quotaError;
      })
    ).rejects.toThrow('myTable/quota-exceeded');
  });

  it('should attach original error as cause', async () => {
    const quotaError = new Error('Storage full');
    quotaError.name = 'QuotaExceededError';

    try {
      await withQuotaHandling('testTable', async () => {
        throw quotaError;
      });
      expect.fail('Should have thrown');
    } catch (err) {
      expect((err as Error & { cause?: unknown }).cause).toBe(quotaError);
    }
  });

  it('should include table name in error message', async () => {
    const quotaError = { code: 22, message: 'Safari quota error' };

    await expect(
      withQuotaHandling('userPreferences', async () => {
        throw quotaError;
      })
    ).rejects.toThrow('userPreferences/quota-exceeded');
  });

  it('should re-throw non-quota errors unchanged', async () => {
    const networkError = new Error('Network failed');

    await expect(
      withQuotaHandling('testTable', async () => {
        throw networkError;
      })
    ).rejects.toThrow(networkError);
  });

  it('should not wrap non-quota errors', async () => {
    const originalError = new Error('Something else');

    try {
      await withQuotaHandling('testTable', async () => {
        throw originalError;
      });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBe(originalError);
      expect((err as Error).message).toBe('Something else');
    }
  });
});
