import { toast } from 'sonner';

import { contractUIStorage } from '../storage';

const MOCK_MAINNET_SEED_TITLE = '[TEST] Ethereum Mainnet (pre-disable)';

/**
 * Dev-only helper (requires `show_dev_tools`). Inserts a saved UI configuration on
 * ethereum-mainnet for testing mainnet-disable behavior when loading legacy records.
 */
export async function seedMockMainnetContractUI(): Promise<string> {
  const existing = (await contractUIStorage.getAll()).find(
    (record) => record.title === MOCK_MAINNET_SEED_TITLE
  );
  if (existing) {
    return existing.id;
  }

  const contractAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

  return contractUIStorage.save({
    title: MOCK_MAINNET_SEED_TITLE,
    ecosystem: 'evm',
    networkId: 'ethereum-mainnet',
    contractAddress,
    functionId: 'transfer',
    formConfig: {
      id: 'transfer',
      functionId: 'transfer',
      title: MOCK_MAINNET_SEED_TITLE,
      contractAddress,
      layout: { columns: 1, spacing: 'normal', labelPosition: 'top' },
      validation: { mode: 'onChange', showErrors: 'inline' },
      submitButton: { text: 'Submit', loadingText: 'Submitting...' },
      fields: [
        {
          id: 'seed-to',
          name: 'to',
          label: 'Recipient',
          type: 'blockchain-address',
          placeholder: '0x...',
          helperText: '',
          defaultValue: '',
          validation: { required: true },
          width: 'full',
          isHidden: false,
          isHardcoded: false,
          readOnly: false,
        },
      ],
    },
    metadata: {
      isManuallyRenamed: true,
      seededForMainnetDisableTest: true,
    },
  });
}

export async function seedMockMainnetContractUIWithToast(): Promise<void> {
  try {
    const id = await seedMockMainnetContractUI();
    toast.success('Mock mainnet configuration seeded', {
      description: `Look for "${MOCK_MAINNET_SEED_TITLE}" in the sidebar (id: ${id}).`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    toast.error('Failed to seed mock mainnet configuration', { description: message });
  }
}
