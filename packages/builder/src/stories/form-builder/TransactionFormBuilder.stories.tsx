import { Meta, StoryObj } from '@storybook/react';

import { AdapterProvider, WalletStateProvider } from '@openzeppelin/transaction-form-react-core';

import { TransactionFormBuilder } from '../../components/FormBuilder/TransactionFormBuilder';
import { getAdapter, getNetworkById } from '../../core/ecosystemManager';

const meta: Meta<typeof TransactionFormBuilder> = {
  title: 'Builder/FormBuilder/TransactionFormBuilder',
  component: TransactionFormBuilder,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The main transaction form builder component that guides users through the process of creating a custom form for blockchain transactions.',
      },
    },
  },
  decorators: [
    (Story) => (
      <AdapterProvider resolveAdapter={getAdapter}>
        <WalletStateProvider
          initialNetworkId="ethereum-mainnet"
          getNetworkConfigById={getNetworkById}
        >
          <Story />
        </WalletStateProvider>
      </AdapterProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
