import { describe, expect, it } from 'vitest';

import type { EcosystemWalletComponents } from '@openzeppelin/ui-types';

import {
  filterWalletComponents,
  getComponentExclusionsFromConfig,
} from '../filterWalletComponents';

// Mock components
const MockConnectButton = () => null;
const MockAccountDisplay = () => null;
const MockNetworkSwitcher = () => null;

describe('filterWalletComponents', () => {
  const allComponents: EcosystemWalletComponents = {
    ConnectButton: MockConnectButton as React.FC,
    AccountDisplay: MockAccountDisplay as React.FC,
    NetworkSwitcher: MockNetworkSwitcher as React.FC,
  };

  it('should return all components when no exclusions', () => {
    const result = filterWalletComponents(allComponents, [], 'test-kit');

    expect(result).toEqual(allComponents);
    expect(result).toHaveProperty('ConnectButton');
    expect(result).toHaveProperty('AccountDisplay');
    expect(result).toHaveProperty('NetworkSwitcher');
  });

  it('should exclude specified components', () => {
    const result = filterWalletComponents(allComponents, ['NetworkSwitcher'], 'test-kit');

    expect(result).toHaveProperty('ConnectButton');
    expect(result).toHaveProperty('AccountDisplay');
    expect(result).not.toHaveProperty('NetworkSwitcher');
  });

  it('should exclude multiple components', () => {
    const result = filterWalletComponents(
      allComponents,
      ['NetworkSwitcher', 'AccountDisplay'],
      'test-kit'
    );

    expect(result).toHaveProperty('ConnectButton');
    expect(result).not.toHaveProperty('AccountDisplay');
    expect(result).not.toHaveProperty('NetworkSwitcher');
  });

  it('should return undefined when all components are excluded', () => {
    const result = filterWalletComponents(
      allComponents,
      ['ConnectButton', 'AccountDisplay', 'NetworkSwitcher'],
      'test-kit'
    );

    expect(result).toBeUndefined();
  });

  it('should return undefined when no components provided', () => {
    const result = filterWalletComponents({}, [], 'test-kit');

    expect(result).toBeUndefined();
  });

  it('should return undefined when null components provided', () => {
    const result = filterWalletComponents(
      null as unknown as EcosystemWalletComponents,
      [],
      'test-kit'
    );

    expect(result).toBeUndefined();
  });

  it('should ignore invalid exclusion keys', () => {
    const result = filterWalletComponents(
      allComponents,
      ['InvalidKey' as keyof EcosystemWalletComponents, 'NetworkSwitcher'],
      'test-kit'
    );

    expect(result).toHaveProperty('ConnectButton');
    expect(result).toHaveProperty('AccountDisplay');
    expect(result).not.toHaveProperty('NetworkSwitcher');
  });
});

describe('getComponentExclusionsFromConfig', () => {
  it('should return empty array when no config', () => {
    const result = getComponentExclusionsFromConfig(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array when no components config', () => {
    const result = getComponentExclusionsFromConfig({
      showInjectedConnector: true,
    });
    expect(result).toEqual([]);
  });

  it('should return empty array when no exclude array', () => {
    const result = getComponentExclusionsFromConfig({
      components: {},
    });
    expect(result).toEqual([]);
  });

  it('should return exclude array when present', () => {
    const result = getComponentExclusionsFromConfig({
      components: {
        exclude: ['NetworkSwitcher', 'AccountDisplay'],
      },
    });
    expect(result).toEqual(['NetworkSwitcher', 'AccountDisplay']);
  });

  it('should handle non-array exclude value', () => {
    const result = getComponentExclusionsFromConfig({
      components: {
        exclude: 'NetworkSwitcher' as unknown as string[],
      },
    });
    expect(result).toEqual([]);
  });

  it('should filter out non-string values', () => {
    const result = getComponentExclusionsFromConfig({
      components: {
        exclude: ['NetworkSwitcher', 123, null, 'AccountDisplay'] as unknown as string[],
      },
    });
    expect(result).toEqual(['NetworkSwitcher', 'AccountDisplay']);
  });

  it('should handle nested config structure', () => {
    const config = {
      components: {
        exclude: ['ConnectButton'],
        otherProp: 'value',
      },
      showInjectedConnector: false,
      appName: 'Test App',
    };

    const result = getComponentExclusionsFromConfig(config);
    expect(result).toEqual(['ConnectButton']);
  });
});
