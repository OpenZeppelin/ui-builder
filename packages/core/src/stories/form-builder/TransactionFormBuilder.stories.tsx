import { Meta, StoryObj } from '@storybook/react';

import { TransactionFormBuilder } from '../../components/FormBuilder/TransactionFormBuilder';

const meta = {
  title: 'Core/FormBuilder/TransactionFormBuilder',
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
  tags: ['autodocs'],
} satisfies Meta<typeof TransactionFormBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
