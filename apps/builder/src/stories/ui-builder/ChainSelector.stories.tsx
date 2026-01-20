import { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Ecosystem } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { ChainSelector } from '../../components/UIBuilder/StepChainSelection/index';

const meta = {
  title: 'Builder/UIBuilder/ChainSelector',
  component: ChainSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component for selecting the blockchain network to work with.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChainSelector>;

export default meta;
type Story = StoryObj<typeof ChainSelector>;

/**
 * Default implementation of the ChainSelector component.
 */
export const Default: Story = {
  args: {
    initialEcosystem: 'evm',
    onNetworkSelect: (networkId: string | null) =>
      logger.info('ChainSelector.stories', 'Selected network:', networkId),
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
      <ChainSelector
        initialEcosystem={selectedEcosystem}
        selectedNetworkId={selectedNetworkId}
        onNetworkSelect={(networkId: string | null) => {
          logger.info('ChainSelector.stories', 'Network selected:', networkId);
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
