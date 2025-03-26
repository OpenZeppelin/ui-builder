import { useState } from 'react';

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

// Common tracking component that can be reused with different initial chains
const ChainSelectWithTracking = ({ initialChain = 'evm' }: { initialChain: ChainType }) => {
  const [selectedChain, setSelectedChain] = useState<ChainType>(initialChain);
  const [selectionCount, setSelectionCount] = useState(0);

  const handleChainSelect = (chain: ChainType) => {
    console.log('Chain selected in story component:', chain);
    setSelectedChain(chain);
    setSelectionCount((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      <StepChainSelect initialChain={initialChain} onChainSelect={handleChainSelect} />
      <div className="bg-muted rounded-md p-4 text-sm">
        <p>
          Currently selected: <span className="font-bold">{selectedChain}</span>
        </p>
        <p className="mt-1">
          Selection changed: <span className="font-bold">{selectionCount} times</span>
        </p>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    // These args are just for documentation since we're using render
    initialChain: 'evm',
    onChainSelect: (chain: ChainType) => console.log('Chain selected:', chain),
  },
  render: () => <ChainSelectWithTracking initialChain="evm" />,
};

export const MidnightSelected: Story = {
  args: {
    // These args are just for documentation since we're using render
    initialChain: 'midnight',
    onChainSelect: (chain: ChainType) => console.log('Chain selected:', chain),
  },
  render: () => <ChainSelectWithTracking initialChain="midnight" />,
};

export const WithSelectionTracking: Story = {
  name: 'With Selection Tracking',
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
  render: () => <ChainSelectWithTracking initialChain="evm" />,
};
