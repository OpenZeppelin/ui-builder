import { logger } from '@openzeppelin/ui-utils';

import { hasMeaningfulContent } from '../../../utils/meaningfulContent';
import { uiBuilderStore } from '../../uiBuilderStore';

/**
 * Guard functions to determine if auto-save should proceed
 */
export class AutoSaveGuards {
  /**
   * Check if auto-save should be blocked due to loading states
   */
  static isLoadingBlocked(
    isLoadingSavedConfigRef: React.RefObject<boolean>,
    currentState: ReturnType<typeof uiBuilderStore.getState>
  ): boolean {
    return !!(
      isLoadingSavedConfigRef.current ||
      currentState.isLoadingConfiguration ||
      (currentState.loadedConfigurationId && !currentState.selectedNetworkConfigId)
    );
  }

  /**
   * Check if configuration ID is valid for auto-save
   * Handles new UI mode - if we're in new UI mode and have meaningful content,
   * we'll need to create a record first
   */
  static hasValidConfigId(configId: string | null, isInNewUIMode: boolean): boolean {
    if (!configId) {
      if (isInNewUIMode) {
        // In new UI mode, no config ID is expected until we create one
        return false;
      }
      logger.warn('builder', 'No loaded configuration ID found - cannot auto-save');
      return false;
    }
    return true;
  }

  /**
   * Check if there's meaningful content to save
   * Delegates to centralized hasMeaningfulContent utility
   */
  static hasMeaningfulContent(currentState: ReturnType<typeof uiBuilderStore.getState>): boolean {
    const hasContent = hasMeaningfulContent(currentState);

    if (!hasContent) {
      logger.info('builder', 'No meaningful content to auto-save yet');
    }

    return hasContent;
  }

  /**
   * Check if we need to create a new record for new UI mode
   */
  static needsRecordCreation(currentState: ReturnType<typeof uiBuilderStore.getState>): boolean {
    return (
      currentState.isInNewUIMode &&
      !currentState.loadedConfigurationId &&
      this.hasMeaningfulContent(currentState)
    );
  }

  /**
   * Run all guard checks in sequence
   */
  static shouldProceedWithAutoSave(
    isLoadingSavedConfigRef: React.RefObject<boolean>,
    currentState: ReturnType<typeof uiBuilderStore.getState>
  ): { proceed: boolean; configId: string | null; needsRecordCreation: boolean } {
    const configId = currentState.loadedConfigurationId;

    // Check loading states
    if (this.isLoadingBlocked(isLoadingSavedConfigRef, currentState)) {
      return { proceed: false, configId, needsRecordCreation: false };
    }

    // Check meaningful content first
    if (!this.hasMeaningfulContent(currentState)) {
      return { proceed: false, configId, needsRecordCreation: false };
    }

    // Check if we need to create a record for new UI mode
    const needsRecordCreation = this.needsRecordCreation(currentState);
    if (needsRecordCreation) {
      return { proceed: true, configId, needsRecordCreation: true };
    }

    // Check config ID for existing records
    if (!this.hasValidConfigId(configId, currentState.isInNewUIMode)) {
      return { proceed: false, configId, needsRecordCreation: false };
    }

    return { proceed: true, configId, needsRecordCreation: false };
  }
}
