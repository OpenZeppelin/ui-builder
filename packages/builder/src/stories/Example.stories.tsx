import type { Meta, StoryObj } from '@storybook/react';

// Example component from the builder package
import { Button } from '@openzeppelin/contracts-ui-builder-ui';

const meta: Meta<typeof Button> = {
  title: 'Builder/Examples/Button',
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
