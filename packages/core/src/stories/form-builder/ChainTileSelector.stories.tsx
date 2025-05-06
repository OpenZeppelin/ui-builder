import { Meta, StoryObj } from '@storybook/react';

import { useState } from 'react';

import { Ecosystem } from '@openzeppelin/transaction-form-types';

import { ChainTileSelector } from '../../components/FormBuilder/StepChainSelection/ChainTileSelector';

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
    initialEcosystem: 'evm',
    onEcosystemSelect: (ecosystem: Ecosystem) => console.log('Selected ecosystem:', ecosystem),
  },
};

/**
 * Interactive demo where selections are tracked in state.
 */
export const Interactive = () => {
  const [selectedEcosystem, setSelectedEcosystem] = useState<Ecosystem>('evm');

  return (
    <div className="max-w-3xl">
      <ChainTileSelector
        initialEcosystem={selectedEcosystem}
        onEcosystemSelect={(ecosystem: Ecosystem) => {
          console.log('Ecosystem selected:', ecosystem);
          setSelectedEcosystem(ecosystem);
        }}
      />
      <div className="mt-4">
        <p>
          <strong>Selected ecosystem:</strong> {selectedEcosystem}
        </p>
      </div>
    </div>
  );
};
