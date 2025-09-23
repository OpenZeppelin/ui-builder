import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { logger } from '@openzeppelin/ui-builder-utils';

import { AutoSaveGuards } from '@/components/ContractsUIBuilder/hooks/builder/autoSave/guards';
import { uiBuilderStore } from '@/components/ContractsUIBuilder/hooks/uiBuilderStore';

// Mock the logger to prevent console output during tests
vi.mock('@openzeppelin/ui-builder-utils', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the entire uiBuilderStore
vi.mock('@/components/ContractsUIBuilder/hooks/uiBuilderStore', () => ({
  uiBuilderStore: {
    getState: vi.fn(),
    updateState: vi.fn(),
    resetWizard: vi.fn(),
    resetDownstreamSteps: vi.fn(),
    subscribe: vi.fn(),
  },
}));

describe('AutoSaveGuards', () => {
  let mockGetState: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mock for uiBuilderStore.getState
    mockGetState = uiBuilderStore.getState as Mock;
  });

  describe('hasValidConfigId', () => {
    it('should return true if a valid configId is provided', () => {
      expect(AutoSaveGuards.hasValidConfigId('some-id', false)).toBe(true);
    });

    it('should return false if configId is null and not in new UI mode', () => {
      expect(AutoSaveGuards.hasValidConfigId(null, false)).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        'builder',
        'No loaded configuration ID found - cannot auto-save'
      );
    });

    it('should return false if in new UI mode, as no config ID is expected yet', () => {
      expect(AutoSaveGuards.hasValidConfigId(null, true)).toBe(false);
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('hasMeaningfulContent', () => {
    it('should return true if selectedNetworkConfigId is present', () => {
      mockGetState.mockReturnValue({ selectedNetworkConfigId: 'net-1' });
      expect(AutoSaveGuards.hasMeaningfulContent(mockGetState())).toBe(true);
    });

    it('should return true if selectedFunction is present', () => {
      mockGetState.mockReturnValue({ selectedFunction: 'myFunction' });
      expect(AutoSaveGuards.hasMeaningfulContent(mockGetState())).toBe(true);
    });

    it('should return true if formConfig is present', () => {
      mockGetState.mockReturnValue({ formConfig: { title: 'Test' } });
      expect(AutoSaveGuards.hasMeaningfulContent(mockGetState())).toBe(true);
    });

    it('should return false if no meaningful content is present', () => {
      mockGetState.mockReturnValue({
        selectedNetworkConfigId: null,
        selectedFunction: null,
        formConfig: null,
      });
      expect(AutoSaveGuards.hasMeaningfulContent(mockGetState())).toBe(false);
    });
  });

  describe('needsRecordCreation', () => {
    it('should return true if in new UI mode, no config ID, and has meaningful content', () => {
      mockGetState.mockReturnValue({
        isInNewUIMode: true,
        loadedConfigurationId: null,
        selectedNetworkConfigId: 'net-1',
      });
      expect(AutoSaveGuards.needsRecordCreation(mockGetState())).toBe(true);
    });

    it('should return false if not in new UI mode', () => {
      mockGetState.mockReturnValue({
        isInNewUIMode: false,
        loadedConfigurationId: null,
        selectedNetworkConfigId: 'net-1',
      });
      expect(AutoSaveGuards.needsRecordCreation(mockGetState())).toBe(false);
    });

    it('should return false if a config ID is already present', () => {
      mockGetState.mockReturnValue({
        isInNewUIMode: true,
        loadedConfigurationId: 'some-id',
        selectedNetworkConfigId: 'net-1',
      });
      expect(AutoSaveGuards.needsRecordCreation(mockGetState())).toBe(false);
    });

    it('should return false if there is no meaningful content', () => {
      mockGetState.mockReturnValue({
        isInNewUIMode: true,
        loadedConfigurationId: null,
        selectedNetworkConfigId: null,
      });
      expect(AutoSaveGuards.needsRecordCreation(mockGetState())).toBe(false);
    });
  });

  describe('shouldProceedWithAutoSave', () => {
    let isLoadingSavedConfigRef: { current: boolean };

    beforeEach(() => {
      isLoadingSavedConfigRef = { current: false };
    });

    it('should not proceed if loading is blocked', () => {
      isLoadingSavedConfigRef.current = true;
      mockGetState.mockReturnValue({ isLoadingFromStorage: false });
      const result = AutoSaveGuards.shouldProceedWithAutoSave(
        isLoadingSavedConfigRef,
        mockGetState()
      );
      expect(result).toEqual({ proceed: false, configId: undefined, needsRecordCreation: false });
    });

    it('should not proceed if there is no meaningful content', () => {
      mockGetState.mockReturnValue({
        loadedConfigurationId: 'some-id',
        selectedNetworkConfigId: null,
      });
      const result = AutoSaveGuards.shouldProceedWithAutoSave(
        isLoadingSavedConfigRef,
        mockGetState()
      );
      expect(result).toEqual({ proceed: false, configId: 'some-id', needsRecordCreation: false });
    });

    it('should proceed and flag for record creation if in new UI mode with meaningful content', () => {
      mockGetState.mockReturnValue({
        isInNewUIMode: true,
        loadedConfigurationId: null,
        selectedNetworkConfigId: 'net-1',
      });
      const result = AutoSaveGuards.shouldProceedWithAutoSave(
        isLoadingSavedConfigRef,
        mockGetState()
      );
      expect(result).toEqual({ proceed: true, configId: null, needsRecordCreation: true });
    });

    it('should not proceed if no config ID and not in new UI mode', () => {
      mockGetState.mockReturnValue({
        isInNewUIMode: false,
        loadedConfigurationId: null,
        selectedNetworkConfigId: 'net-1',
      });
      const result = AutoSaveGuards.shouldProceedWithAutoSave(
        isLoadingSavedConfigRef,
        mockGetState()
      );
      expect(result).toEqual({ proceed: false, configId: null, needsRecordCreation: false });
    });

    it('should proceed for an existing record with meaningful content', () => {
      mockGetState.mockReturnValue({
        isInNewUIMode: false,
        loadedConfigurationId: 'existing-id',
        selectedNetworkConfigId: 'net-1',
      });
      const result = AutoSaveGuards.shouldProceedWithAutoSave(
        isLoadingSavedConfigRef,
        mockGetState()
      );
      expect(result).toEqual({
        proceed: true,
        configId: 'existing-id',
        needsRecordCreation: false,
      });
    });
  });
});
