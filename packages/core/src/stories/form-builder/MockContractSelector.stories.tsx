import type { Meta, StoryObj } from '@storybook/react';

import { MockContractSelector } from '../../components/FormBuilder/ContractSelectors/MockContractSelector';

const meta: Meta<typeof MockContractSelector> = {
  title: 'Core/FormBuilder/MockContractSelector',
  component: MockContractSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MockContractSelector>;

export const Default: Story = {
  args: {
    onSelectMock: (mockId: string) => {
      console.log('Selected mock contract:', mockId);
    },
  },
};

export const WithChainTypeFilter: Story = {
  args: {
    onSelectMock: (mockId: string) => {
      console.log('Selected mock contract:', mockId);
    },
    chainType: 'evm',
  },
};
