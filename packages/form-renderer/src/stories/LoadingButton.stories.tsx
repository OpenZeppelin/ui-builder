import React, { useState } from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { LoadingButton } from '../components/ui/loading-button';

const meta = {
  title: 'Form Renderer/UI/LoadingButton',
  component: LoadingButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A button component that displays a loading spinner when in the loading state.',
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
    loading: {
      control: 'boolean',
      description: 'Whether the button is in a loading state',
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
} satisfies Meta<typeof LoadingButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default loading button
export const Default: Story = {
  args: {
    children: 'Loading Button',
    variant: 'default',
    size: 'default',
    loading: false,
  },
};

// Loading state
export const Loading: Story = {
  args: {
    children: 'Loading...',
    loading: true,
  },
};

// All variants
export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The different visual styles of the loading button component.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <LoadingButton variant="default" loading>
          Default
        </LoadingButton>
        <LoadingButton variant="destructive" loading>
          Destructive
        </LoadingButton>
        <LoadingButton variant="outline" loading>
          Outline
        </LoadingButton>
        <LoadingButton variant="secondary" loading>
          Secondary
        </LoadingButton>
        <LoadingButton variant="ghost" loading>
          Ghost
        </LoadingButton>
        <LoadingButton variant="link" loading>
          Link
        </LoadingButton>
      </div>
    </div>
  ),
};

// Interactive loading button
export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A loading button that toggles between loading and normal states.',
      },
    },
  },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = () => {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };

    return (
      <LoadingButton loading={isLoading} onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Click to simulate loading'}
      </LoadingButton>
    );
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

// Loading button sizes
export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The different sizes available for the loading button component.',
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <LoadingButton size="sm" loading>
        Small
      </LoadingButton>
      <LoadingButton size="default" loading>
        Default
      </LoadingButton>
      <LoadingButton size="lg" loading>
        Large
      </LoadingButton>
    </div>
  ),
};
