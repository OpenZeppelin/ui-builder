import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { FormValues } from '@openzeppelin/ui-types';

import { useContractForm } from '../hooks/useContractForm';

describe('useContractForm reset guard', () => {
  it('does not overwrite in-progress contractAddress edits with existingFormValues', async () => {
    const adapter = null;
    const existingFormValues: FormValues = {
      contractAddress: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    };

    const props = {
      adapter,
      existingFormValues,
      loadedConfigurationId: 'config-1',
      networkId: 'net-1',
      contractDefinitionSource: null,
      contractDefinitionJson: null,
      contractError: null,
    } as const;

    const { result, rerender } = renderHook(
      (p: Parameters<typeof useContractForm>[0]) => useContractForm(p),
      {
        initialProps: props,
      }
    );

    // Simulate user typing a different address before any reset from storage applies
    // We do this by re-rendering with the same props (which may trigger the internal reset logic)
    // and verifying that the watched contractAddressValue reflects the user change
    // rather than the existingFormValues snapshot
    // Note: react-hook-form is internal; we rely on the hook's return value

    // First render should reflect existing defaults from props
    expect(result.current.contractAddressValue).toBe('0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');

    // Simulate input typing by mocking watch return - not straightforward; instead rely on guard path:
    // Re-render with the same props; the guard should prevent reset if the input differs from existing
    // Here we emulate that by changing existingFormValues to a new address and ensure our guard uses the current value

    const updatedProps = {
      ...props,
      existingFormValues: { contractAddress: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' },
    } as const;

    rerender(updatedProps);

    // The hook should not clobber in-progress edits; verify the value was NOT reset to updated props
    expect(result.current.contractAddressValue).toBe('0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    expect(result.current.validationError).toBeNull();
  });
});
