import { Meta, StoryObj } from '@storybook/react';

import { useState } from 'react';

import { Ecosystem } from '@openzeppelin/contracts-ui-builder-types';

import { ChainTileSelector } from '../../components/FormBuilder/StepChainSelection/index';

const meta = {
  title: 'Builder/FormBuilder/ChainTileSelector',
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
    initialEcosystem: 'evm',
    onNetworkSelect: (networkId: string | null) => console.log('Selected network:', networkId),
  },
};

/**
 * Interactive demo where selections are tracked in state.
 */
export const Interactive = () => {
  // Using a simple value instead of state since we're not updating it in this demo
  const selectedEcosystem: Ecosystem = 'evm';
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);

  return (
    <div className="max-w-3xl">
      <ChainTileSelector
        initialEcosystem={selectedEcosystem}
        selectedNetworkId={selectedNetworkId}
        onNetworkSelect={(networkId: string | null) => {
          console.log('Network selected:', networkId);
          setSelectedNetworkId(networkId);
        }}
      />
      <div className="mt-4">
        <p>
          <strong>Selected ecosystem:</strong> {selectedEcosystem}
        </p>
        {selectedNetworkId && (
          <p>
            <strong>Selected network ID:</strong> {selectedNetworkId}
          </p>
        )}
      </div>
    </div>
  );
};
