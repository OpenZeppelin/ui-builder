import { Meta, StoryObj } from '@storybook/react';

import { TransactionFormBuilder } from './TransactionFormBuilder';

const meta: Meta<typeof TransactionFormBuilder> = {
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
};

export default meta;
type Story = StoryObj<typeof TransactionFormBuilder>;

export const Default: Story = {
  args: {},
};
