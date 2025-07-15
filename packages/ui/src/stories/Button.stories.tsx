import { Meta, StoryObj } from '@storybook/react';

import { Button } from '../components/ui/button';

const meta = {
  title: 'Renderer/UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with various styles and sizes.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style of the button',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    asChild: {
      control: 'boolean',
      description: 'Whether to merge props onto child',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default button
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
  },
};

// All variants
export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The different visual styles of the button component.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  ),
};

// All sizes
export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The different sizes available for the button component.',
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </Button>
    </div>
  ),
};

// Disabled state
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

// With icon
export const WithIcon: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Button with an icon alongside text.',
      },
    },
  },
  render: () => (
    <Button>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-2"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
      With Icon
    </Button>
  ),
};

// Full width
export const FullWidth: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Button that takes the full width of its container.',
      },
    },
  },
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <Button className="w-full">Full Width Button</Button>
      <Button variant="outline" className="w-full">
        Full Width Outline Button
      </Button>
    </div>
  ),
};
