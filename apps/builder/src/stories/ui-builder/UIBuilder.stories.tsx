import { Meta, StoryObj } from '@storybook/react';

import { AdapterProvider, WalletStateProvider } from '@openzeppelin/ui-react';

import { UIBuilder } from '../../components/UIBuilder';
import { getAdapter, getNetworkById } from '../../core/ecosystemManager';

const meta: Meta<typeof UIBuilder> = {
  title: 'Builder/UIBuilder',
  component: UIBuilder,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The main UI Builder component that guides users through the process of creating a custom form for blockchain transactions.',
      },
    },
  },
  decorators: [
    (Story) => (
      <AdapterProvider resolveAdapter={getAdapter}>
        <WalletStateProvider initialNetworkId={null} getNetworkConfigById={getNetworkById}>
          <Story />
        </WalletStateProvider>
      </AdapterProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
