import { Meta, StoryObj } from '@storybook/react';

import { Input } from './input';
import { Label } from './label';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
    },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'This is a default value',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter email address...',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password...',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: 'Enter number...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="input-with-label" className="text-sm font-medium">
        Email
      </Label>
      <Input id="input-with-label" placeholder="Enter your email" />
      <p className="text-muted-foreground text-sm">Enter your email address.</p>
    </div>
  ),
};

export const InputGroup: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="name" className="text-sm font-medium">
          Name
        </Label>
        <Input id="name" placeholder="Enter your name" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <Input id="email" type="email" placeholder="Enter your email" />
      </div>
    </div>
  ),
};
