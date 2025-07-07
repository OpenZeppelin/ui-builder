import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Speed } from '@openzeppelin/relayer-sdk';

import { useEvmRelayerOptions } from '../useEvmRelayerOptions';

describe('useEvmRelayerOptions', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should notify parent with default speed on initial mount when no speed is provided', () => {
    const options = {}; // No speed provided

    renderHook(() =>
      useEvmRelayerOptions({
        options,
        onChange: mockOnChange,
      })
    );

    // Should be called once with the default speed
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith({ speed: Speed.FAST });
  });

  it('should not notify parent when speed is already provided in options', () => {
    const options = { speed: Speed.AVERAGE }; // Speed already provided

    renderHook(() =>
      useEvmRelayerOptions({
        options,
        onChange: mockOnChange,
      })
    );

    // Should not be called since speed is already provided
    expect(mockOnChange).toHaveBeenCalledTimes(0);
  });

  it('should not notify parent when custom gas settings are provided', () => {
    const options = { gasPrice: 25000000000 }; // Custom gas price provided

    renderHook(() =>
      useEvmRelayerOptions({
        options,
        onChange: mockOnChange,
      })
    );

    // Should not be called since custom settings are provided
    expect(mockOnChange).toHaveBeenCalledTimes(0);
  });

  it('should include gasLimit in initial notification if provided', () => {
    const options = { gasLimit: 500000 }; // Gas limit provided but no speed

    renderHook(() =>
      useEvmRelayerOptions({
        options,
        onChange: mockOnChange,
      })
    );

    // Should be called with both speed and gasLimit
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith({
      speed: Speed.FAST,
      gasLimit: 500000,
    });
  });

  it('should notify parent when speed is changed after initial mount', () => {
    const options = {};

    const { result } = renderHook(() =>
      useEvmRelayerOptions({
        options,
        onChange: mockOnChange,
      })
    );

    // Clear the initial call
    mockOnChange.mockClear();

    // Change speed
    act(() => {
      result.current.handleSpeedChange(Speed.FASTEST);
    });

    // Wait for the debounced update
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should be called with the new speed
    expect(mockOnChange).toHaveBeenCalledWith({ speed: Speed.FASTEST });
  });
});
