import type { Meta, StoryObj } from '@storybook/react';

import { useState } from 'react';

import { AddressInput } from './address-input';

const meta: Meta<typeof AddressInput> = {
  title: 'Core/UI/AddressInput',
  component: AddressInput,
  tags: ['autodocs'],
  argTypes: {
    chainType: {
      control: 'select',
      options: ['evm', 'solana', 'stellar', 'midnight'],
      description: 'Blockchain type for address validation',
    },
    placeholder: {
      control: 'text',
      description: 'Input placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    label: {
      control: 'text',
      description: 'Label text for the input',
    },
  },
};

export default meta;

type Story = StoryObj<typeof AddressInput>;

export const Default: Story = {
  args: {
    label: 'Blockchain Address',
    placeholder: 'Enter blockchain address',
    chainType: 'evm',
  },
  render: (args) => <AddressInput {...args} />,
};

export const WithValidEthereumAddress: Story = {
  args: {
    label: 'Ethereum Address',
    placeholder: 'Enter Ethereum address',
    chainType: 'evm',
    value: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
  },
  render: (args) => <AddressInput {...args} />,
};

export const WithInvalidEthereumAddress: Story = {
  args: {
    label: 'Ethereum Address',
    placeholder: 'Enter Ethereum address',
    chainType: 'evm',
    value: '0xInvalidAddressFormat',
  },
  render: (args) => <AddressInput {...args} />,
};

export const WithCopyButton: Story = {
  args: {
    label: 'Copy Address',
    value: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
    chainType: 'evm',
  },
  render: (args) => <AddressInput {...args} />,
};

export const Disabled: Story = {
  args: {
    label: 'Disabled State',
    value: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
    disabled: true,
    chainType: 'evm',
  },
  render: (args) => <AddressInput {...args} />,
};

export const Interactive: Story = {
  args: {
    label: 'Interactive Example',
    placeholder: 'Type an address to see validation',
    chainType: 'evm',
  },
  render: function Render(args) {
    const [value, setValue] = useState('');

    return <AddressInput {...args} value={value} onChange={(e) => setValue(e.target.value)} />;
  },
};

export const SolanaAddress: Story = {
  args: {
    label: 'Solana Address',
    placeholder: 'Enter Solana address',
    chainType: 'solana',
    value: '5KPJkRJ4LBRqYHb84yadCWY1WiNEfwcEFXuun1SEPMnr',
  },
  render: (args) => <AddressInput {...args} />,
};
