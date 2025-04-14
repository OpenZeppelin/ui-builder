import type { Meta, StoryObj } from '@storybook/react';

// Example component from the core package
import { Button } from '../../../form-renderer/src/components/ui/button';

const meta: Meta<typeof Button> = {
  title: 'Core/Examples/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

// Primary button story
export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Primary Button',
  },
};

// Secondary button story
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

// Outline button story
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};
