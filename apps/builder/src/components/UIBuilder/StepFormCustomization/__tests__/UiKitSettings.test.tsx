import '@testing-library/jest-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AvailableUiKit, ContractAdapter } from '@openzeppelin/ui-types';

import { UiKitSettings } from '../components/UiKitSettings';

// Mock the logger with partial mocking to keep other exports
vi.mock('@openzeppelin/ui-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openzeppelin/ui-utils')>();
  return {
    ...actual,
    logger: {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  };
});

// Mock window.matchMedia for useMediaQuery hook
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false, // Default to desktop layout in tests
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated method
    removeListener: vi.fn(), // deprecated method
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('UiKitSettings', () => {
  const mockAdapter: Partial<ContractAdapter> = {
    getAvailableUiKits: vi.fn().mockResolvedValue([
      {
        id: 'rainbowkit',
        name: 'RainbowKit',
        configFields: [],
        hasCodeEditor: true,
        defaultCode: '// Default RainbowKit config',
        description: 'Custom config for export only',
      },
      {
        id: 'connectkit',
        name: 'ConnectKit',
        configFields: [],
        hasCodeEditor: false,
      },
    ] as AvailableUiKit[]),
  };

  it('should update config immediately when typing custom code', async () => {
    const onUpdateConfig = vi.fn();

    render(
      <UiKitSettings
        adapter={mockAdapter as ContractAdapter}
        onUpdateConfig={onUpdateConfig}
        currentConfig={{ kitName: 'rainbowkit', kitConfig: {} }}
      />
    );

    // Wait for kits to load
    await waitFor(() => {
      expect(screen.getByText('RainbowKit Configuration')).toBeInTheDocument();
    });

    // Find the code editor
    const codeEditor = screen.getByPlaceholderText('Enter your custom configuration code here.');

    // Type in the editor
    fireEvent.change(codeEditor, {
      target: { value: 'const theme = darkTheme();' },
    });

    // Should update config immediately with custom code
    expect(onUpdateConfig).toHaveBeenCalledWith({
      kitName: 'rainbowkit',
      kitConfig: {},
      customCode: 'const theme = darkTheme();',
    });
  });

  it('should include customCode when switching UI kits', async () => {
    const onUpdateConfig = vi.fn();

    render(
      <UiKitSettings
        adapter={mockAdapter as ContractAdapter}
        onUpdateConfig={onUpdateConfig}
        currentConfig={{ kitName: 'rainbowkit', kitConfig: {} }}
      />
    );

    // Wait for kits to load
    await waitFor(() => {
      expect(screen.getByText('RainbowKit')).toBeInTheDocument();
    });

    // Click on ConnectKit option
    const connectKitOption = screen.getByText('ConnectKit');
    fireEvent.click(connectKitOption);

    // Should update config with new kit
    expect(onUpdateConfig).toHaveBeenCalledWith({
      kitName: 'connectkit',
      kitConfig: {},
      customCode: undefined, // ConnectKit doesn't have code editor
    });
  });

  it('should preserve customCode across updates', async () => {
    const onUpdateConfig = vi.fn();
    const customCode = 'import { darkTheme } from "@rainbow-me/rainbowkit";';

    render(
      <UiKitSettings
        adapter={mockAdapter as ContractAdapter}
        onUpdateConfig={onUpdateConfig}
        currentConfig={{
          kitName: 'rainbowkit',
          kitConfig: {},
          customCode,
        }}
      />
    );

    // Wait for kits to load
    await waitFor(() => {
      expect(screen.getByText('RainbowKit Configuration')).toBeInTheDocument();
    });

    // Code editor should show the existing custom code
    const codeEditor = screen.getByPlaceholderText('Enter your custom configuration code here.');
    expect(codeEditor).toHaveValue(customCode);
  });

  it('should show helper text about automatic saving', async () => {
    const onUpdateConfig = vi.fn();

    render(
      <UiKitSettings
        adapter={mockAdapter as ContractAdapter}
        onUpdateConfig={onUpdateConfig}
        currentConfig={{ kitName: 'rainbowkit', kitConfig: {} }}
      />
    );

    // Wait for kits to load
    await waitFor(() => {
      expect(screen.getByText('RainbowKit Configuration')).toBeInTheDocument();
    });

    // Should show helper text
    expect(screen.getByText('💡 Changes are saved automatically as you type.')).toBeInTheDocument();
  });
});
