import React, { ReactNode, useEffect } from 'react';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import { AnalyticsService } from '../services/AnalyticsService';
import { AnalyticsContext } from './AnalyticsContext';

/**
 * Props for the AnalyticsProvider component
 */
export interface AnalyticsProviderProps {
  /** Google Analytics tag ID */
  tagId?: string;
  /** Whether to automatically initialize analytics on mount (default: true) */
  autoInit?: boolean;
  /** Child components */
  children: ReactNode;
}

/**
 * Analytics context interface
 */
export interface AnalyticsContextValue {
  /** Google Analytics tag ID */
  tagId?: string;
  /** Whether analytics is enabled via feature flag */
  isEnabled: boolean;
  /** Initialize analytics with optional tag ID override */
  initialize: (tagIdOverride?: string) => void;
  /** Track ecosystem selection */
  trackEcosystemSelection: (ecosystem: string) => void;
  /** Track network selection */
  trackNetworkSelection: (networkId: string, ecosystem: string) => void;
  /** Track export action */
  trackExportAction: (exportType: string) => void;
  /** Track wizard step progression */
  trackWizardStep: (stepNumber: number, stepName: string) => void;
  /** Track sidebar interactions */
  trackSidebarInteraction: (action: string) => void;
}

/**
 * Analytics Provider component
 * Provides analytics functionality throughout the React component tree
 */
export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  tagId,
  autoInit = true,
  children,
}) => {
  useEffect(() => {
    if (autoInit && tagId) {
      AnalyticsService.initialize(tagId);
    }
  }, [tagId, autoInit]);

  const contextValue: AnalyticsContextValue = {
    tagId,
    isEnabled: AnalyticsService.isEnabled(),
    initialize: (tagIdOverride?: string) => {
      const effectiveTagId = tagIdOverride || tagId;
      if (effectiveTagId) {
        AnalyticsService.initialize(effectiveTagId);
      }
    },
    trackEcosystemSelection: (ecosystem: string) => {
      try {
        AnalyticsService.trackEcosystemSelection(ecosystem);
      } catch (error) {
        logger.error('AnalyticsProvider', 'Error tracking ecosystem selection:', error);
      }
    },
    trackNetworkSelection: (networkId: string, ecosystem: string) => {
      try {
        AnalyticsService.trackNetworkSelection(networkId, ecosystem);
      } catch (error) {
        logger.error('AnalyticsProvider', 'Error tracking network selection:', error);
      }
    },
    trackExportAction: (exportType: string) => {
      try {
        AnalyticsService.trackExportAction(exportType);
      } catch (error) {
        logger.error('AnalyticsProvider', 'Error tracking export action:', error);
      }
    },
    trackWizardStep: (stepNumber: number, stepName: string) => {
      try {
        AnalyticsService.trackWizardStep(stepNumber, stepName);
      } catch (error) {
        logger.error('AnalyticsProvider', 'Error tracking wizard step:', error);
      }
    },
    trackSidebarInteraction: (action: string) => {
      try {
        AnalyticsService.trackSidebarInteraction(action);
      } catch (error) {
        logger.error('AnalyticsProvider', 'Error tracking sidebar interaction:', error);
      }
    },
  };

  return <AnalyticsContext.Provider value={contextValue}>{children}</AnalyticsContext.Provider>;
};
