import { Meta, StoryObj } from '@storybook/react';

import { LoadingButton } from './loading-button';

const meta: Meta<typeof LoadingButton> = {
  title: 'UI/LoadingButton',
  component: LoadingButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    loading: {
      control: 'boolean',
    },
    asChild: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingButton>;

export const Default: Story = {
  args: {
    children: 'Default Button',
    variant: 'default',
    size: 'default',
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading...',
    loading: true,
  },
};

export const LoadingDisabled: Story = {
  args: {
    children: 'Loading...',
    loading: true,
    disabled: true,
  },
};

export const LoadingOutline: Story = {
  args: {
    children: 'Loading...',
    variant: 'outline',
    loading: true,
  },
};

export const LoadingSecondary: Story = {
  args: {
    children: 'Loading...',
    variant: 'secondary',
    loading: true,
  },
};

export const LoadingDestructive: Story = {
  args: {
    children: 'Loading...',
    variant: 'destructive',
    loading: true,
  },
};

export const SmallLoading: Story = {
  args: {
    children: 'Loading...',
    size: 'sm',
    loading: true,
  },
};

export const LargeLoading: Story = {
  args: {
    children: 'Loading...',
    size: 'lg',
    loading: true,
  },
};

export const VariantShowcase: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <LoadingButton variant="default" loading>
          Loading Default
        </LoadingButton>
        <LoadingButton variant="default">Default</LoadingButton>
      </div>
      <div className="flex items-center gap-2">
        <LoadingButton variant="secondary" loading>
          Loading Secondary
        </LoadingButton>
        <LoadingButton variant="secondary">Secondary</LoadingButton>
      </div>
      <div className="flex items-center gap-2">
        <LoadingButton variant="destructive" loading>
          Loading Destructive
        </LoadingButton>
        <LoadingButton variant="destructive">Destructive</LoadingButton>
      </div>
      <div className="flex items-center gap-2">
        <LoadingButton variant="outline" loading>
          Loading Outline
        </LoadingButton>
        <LoadingButton variant="outline">Outline</LoadingButton>
      </div>
      <div className="flex items-center gap-2">
        <LoadingButton variant="ghost" loading>
          Loading Ghost
        </LoadingButton>
        <LoadingButton variant="ghost">Ghost</LoadingButton>
      </div>
      <div className="flex items-center gap-2">
        <LoadingButton variant="link" loading>
          Loading Link
        </LoadingButton>
        <LoadingButton variant="link">Link</LoadingButton>
      </div>
    </div>
  ),
};

export const ThemeContrast: Story = {
  parameters: {
    backgrounds: { default: 'light' },
  },
  render: () => (
    <div className="flex flex-col gap-8 rounded-md border p-4">
      <div>
        <h3 className="mb-4 text-lg font-medium">Light Mode Loading Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <LoadingButton variant="default" loading>
            Default
          </LoadingButton>
          <LoadingButton variant="secondary" loading>
            Secondary
          </LoadingButton>
          <LoadingButton variant="destructive" loading>
            Destructive
          </LoadingButton>
          <LoadingButton variant="outline" loading>
            Outline
          </LoadingButton>
          <LoadingButton variant="ghost" loading>
            Ghost
          </LoadingButton>
          <LoadingButton variant="link" loading>
            Link
          </LoadingButton>
        </div>
      </div>

      <div className="dark rounded-md bg-[oklch(0.145_0_0)] p-4">
        <h3 className="mb-4 text-lg font-medium text-[oklch(0.985_0_0)]">
          Dark Mode Loading Buttons
        </h3>
        <div className="flex flex-wrap gap-4">
          <LoadingButton variant="default" loading>
            Default
          </LoadingButton>
          <LoadingButton variant="secondary" loading>
            Secondary
          </LoadingButton>
          <LoadingButton variant="destructive" loading>
            Destructive
          </LoadingButton>
          <LoadingButton variant="outline" loading>
            Outline
          </LoadingButton>
          <LoadingButton variant="ghost" loading>
            Ghost
          </LoadingButton>
          <LoadingButton variant="link" loading>
            Link
          </LoadingButton>
        </div>
      </div>
    </div>
  ),
};
