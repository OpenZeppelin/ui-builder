import { useState } from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { StepChainSelect } from './StepChainSelect';

import type { ChainType } from '../../core/types/ContractSchema';

const meta: Meta<typeof StepChainSelect> = {
  title: 'Core/FormBuilder/StepChainSelect',
  component: StepChainSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component for selecting the blockchain network to work with.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StepChainSelect>;

export const Default: Story = {
  args: {
    initialChain: 'evm',
    onChainSelect: (chain: ChainType) => console.log('Chain selected:', chain),
  },
};

export const MidnightSelected: Story = {
  args: {
    initialChain: 'midnight',
    onChainSelect: (chain: ChainType) => console.log('Chain selected:', chain),
  },
};

// Using a proper React component to avoid the useState hook error
const ChainSelectWithTracking = () => {
  const [selectedChain, setSelectedChain] = useState<ChainType>('evm');

  return (
    <div className="space-y-4">
      <StepChainSelect initialChain={selectedChain} onChainSelect={setSelectedChain} />
      <div className="bg-muted rounded-md p-4 text-sm">
        <p>
          Currently selected: <span className="font-bold">{selectedChain}</span>
        </p>
      </div>
    </div>
  );
};

export const WithSelectionTracking: Story = {
  render: () => <ChainSelectWithTracking />,
};
