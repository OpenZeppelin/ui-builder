import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ecosystem } from '@openzeppelin/ui-types';

import { uiBuilderStore } from '../../../UIBuilder/hooks/uiBuilderStore';
import MainActions from '../MainActions';

const mockTrackSidebarInteraction = vi.fn();
const mockExportContractUIs = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../../hooks/useBuilderAnalytics', () => ({
  useBuilderAnalytics: () => ({
    trackSidebarInteraction: mockTrackSidebarInteraction,
  }),
}));

vi.mock('../../../../contexts/useContractUIStorage', () => ({
  useContractUIStorage: () => ({
    exportContractUIs: mockExportContractUIs,
    contractUIs: [
      {
        id: 'r1',
        title: 'Saved UI',
        ecosystem: 'evm',
        networkId: 'ethereum-mainnet',
        contractAddress: '0x0000000000000000000000000000000000000001',
        functionId: 'transfer',
        formConfig: { fields: [{ id: 'f1' }] },
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  }),
}));

vi.mock('../../../AddressBook/AddressBookDialog', () => ({
  AddressBookDialog: () => null,
}));

vi.mock('../../../UIBuilder/utils/meaningfulContent', () => ({
  recordHasMeaningfulContent: () => true,
}));

describe('MainActions analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiBuilderStore.updateState(() => ({
      selectedNetworkConfigId: 'stellar-testnet',
      selectedEcosystem: 'stellar' as Ecosystem,
    }));
  });

  it('fires sidebar_interaction import exactly once with the selected network context', () => {
    const onShowImportDialog = vi.fn();
    render(<MainActions onShowImportDialog={onShowImportDialog} />);

    fireEvent.click(screen.getByRole('button', { name: /import/i }));

    expect(mockTrackSidebarInteraction).toHaveBeenCalledTimes(1);
    expect(mockTrackSidebarInteraction).toHaveBeenCalledWith('import', {
      networkId: 'stellar-testnet',
      ecosystem: 'stellar',
    });
    expect(onShowImportDialog).toHaveBeenCalledTimes(1);
  });

  it('fires sidebar_interaction export exactly once with the selected network context', () => {
    render(<MainActions onShowImportDialog={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    expect(mockTrackSidebarInteraction).toHaveBeenCalledTimes(1);
    expect(mockTrackSidebarInteraction).toHaveBeenCalledWith('export', {
      networkId: 'stellar-testnet',
      ecosystem: 'stellar',
    });
    expect(mockExportContractUIs).toHaveBeenCalledTimes(1);
  });

  it('passes null network id when no network has been selected yet', () => {
    uiBuilderStore.updateState(() => ({ selectedNetworkConfigId: null }));
    render(<MainActions onShowImportDialog={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /import/i }));

    expect(mockTrackSidebarInteraction).toHaveBeenCalledWith('import', {
      networkId: null,
      ecosystem: 'stellar',
    });
  });
});
