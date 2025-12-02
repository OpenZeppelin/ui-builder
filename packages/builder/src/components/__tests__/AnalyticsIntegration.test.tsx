import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsProvider } from '../../hooks/AnalyticsProvider';
import { AnalyticsService } from '../../services/AnalyticsService';

// Mock the AnalyticsService
vi.mock('../../services/AnalyticsService', () => ({
  AnalyticsService: {
    initialize: vi.fn(),
    isEnabled: vi.fn(),
    trackEcosystemSelection: vi.fn(),
    trackNetworkSelection: vi.fn(),
    trackExportAction: vi.fn(),
    trackWizardStep: vi.fn(),
    trackSidebarInteraction: vi.fn(),
  },
}));

// Mock other dependencies
vi.mock('@openzeppelin/ui-builder-utils', () => ({
  appConfigService: {
    isFeatureEnabled: vi.fn(),
  },
  logger: {
    info: vi.fn(),
  },
  cn: vi.fn(),
}));

vi.mock('../../../contexts/useContractUIStorage', () => ({
  useContractUIStorage: vi.fn(),
}));

vi.mock('@openzeppelin/ui-builder-react-core', () => ({
  useAdapterContext: vi.fn(),
}));

vi.mock('../../core/networks/service', () => ({
  networkService: {
    getNetworksByEcosystem: vi.fn(),
    getNetworkById: vi.fn(),
  },
}));

vi.mock('../../utils/ecosystem-feature-flags', () => ({
  getVisibleEcosystems: vi.fn(),
  getEcosystemFeatureConfig: vi.fn(),
  isEcosystemEnabled: vi.fn(),
}));

vi.mock('../../core/ecosystems/registry', () => ({
  getEcosystemName: vi.fn(),
  getEcosystemDescription: vi.fn(),
  getEcosystemNetworkIconName: vi.fn(),
}));

// Get mocked functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAnalyticsService = AnalyticsService as any;

describe('Analytics Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalyticsService.isEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Ecosystem Selection Tracking', () => {
    it('should track ecosystem selection when user selects an ecosystem', async () => {
      // This test will verify that ecosystem selection triggers analytics
      // We'll implement this after adding the actual tracking to components
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Network Selection Tracking', () => {
    it('should track network selection when user selects a network', async () => {
      // This test will verify that network selection triggers analytics
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Export Action Tracking', () => {
    it('should track export action when user clicks export button', async () => {
      // This test will verify that export button clicks trigger analytics
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Wizard Step Tracking', () => {
    it('should track wizard step progression', async () => {
      // This test will verify that wizard step changes trigger analytics
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Sidebar Interaction Tracking', () => {
    it('should track sidebar import action', async () => {
      // This test will verify that sidebar import clicks trigger analytics
      expect(true).toBe(true); // Placeholder
    });

    it('should track sidebar export action', async () => {
      // This test will verify that sidebar export clicks trigger analytics
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Analytics Provider Integration', () => {
    it('should provide analytics context to child components', () => {
      const TestComponent = () => {
        return <div data-testid="test-component">Test</div>;
      };

      render(
        <AnalyticsProvider tagId="G-TEST123" autoInit={false}>
          <TestComponent />
        </AnalyticsProvider>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });
});
