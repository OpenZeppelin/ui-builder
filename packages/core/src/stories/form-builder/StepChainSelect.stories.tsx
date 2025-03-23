import React, { useState } from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { StepChainSelect } from '../../components/FormBuilder/StepChainSelect';

import type { ChainType } from '../../core/types/ContractSchema';

const meta = {
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
} satisfies Meta<typeof StepChainSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

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

// The render approach is the proper way to use custom components in Storybook
export const WithStateTracking: Story = {
  args: {
    // These args are required by the type system but won't be used
    initialChain: 'evm',
    onChainSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing state tracking with a custom wrapper component.',
      },
    },
  },
  render: () => <ChainSelectWithTracking />,
};
