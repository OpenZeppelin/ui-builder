import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { uiBuilderStore } from '../../hooks/uiBuilderStore';
import { useFormSync } from '../hooks/useFormSync';

describe('useFormSync downstream reset', () => {
  it('resets selectedFunction and formConfig when contract address changes', () => {
    // Seed store with a selected function and formConfig
    uiBuilderStore.setInitialState({
      contractState: {
        ...uiBuilderStore.getState().contractState,
        address: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      },
      selectedFunction: 'fn1',
      formConfig: {
        functionId: 'fn1',
        contractAddress: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        fields: [],
        layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
        validation: { mode: 'onChange', showErrors: 'inline' },
      },
      isExecutionStepValid: true,
    });

    const { rerender } = renderHook(
      ({ addr }: { addr: string | undefined }) =>
        useFormSync({
          debouncedManualDefinition: undefined,
          contractAddressValue: addr,
          currentContractAddress: uiBuilderStore.getState().contractState.address,
        }),
      { initialProps: { addr: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' } }
    );

    // After address change, downstream should be reset
    const stateAfter = uiBuilderStore.getState();
    expect(stateAfter.selectedFunction).toBeNull();
    expect(stateAfter.formConfig).toBeNull();
    expect(stateAfter.isExecutionStepValid).toBe(false);

    // Clearing address also keeps downstream reset
    act(() => rerender({ addr: '' }));
    const stateCleared = uiBuilderStore.getState();
    expect(stateCleared.selectedFunction).toBeNull();
    expect(stateCleared.formConfig).toBeNull();
  });
});
