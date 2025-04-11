import { useState } from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { ChainTileSelector } from '../../components/FormBuilder/ChainTileSelector';

import type { ChainType } from '../../core/types/ContractSchema';

const meta = {
  title: 'Core/FormBuilder/ChainTileSelector',
  component: ChainTileSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component for selecting the blockchain network to work with.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChainTileSelector>;

export default meta;
type Story = StoryObj<typeof ChainTileSelector>;

/**
 * Default implementation of the ChainTileSelector component.
 */
export const Default: Story = {
  args: {
    initialChain: 'evm',
    onChainSelect: (chain) => console.log('Selected chain:', chain),
  },
};

/**
 * Interactive demo where selections are tracked in state.
 */
export const Interactive = () => {
  const [selectedChain, setSelectedChain] = useState<ChainType>('evm');

  return (
    <div className="max-w-3xl">
      <ChainTileSelector
        initialChain={selectedChain}
        onChainSelect={(chain) => {
          console.log('Chain selected:', chain);
          setSelectedChain(chain);
        }}
      />
      <div className="mt-4">
        <p>
          <strong>Selected chain:</strong> {selectedChain}
        </p>
      </div>
    </div>
  );
};
