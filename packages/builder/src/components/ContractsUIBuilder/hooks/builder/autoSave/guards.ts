import { logger } from '@openzeppelin/contracts-ui-builder-utils';

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
   */
  static hasValidConfigId(configId: string | null): boolean {
    if (!configId) {
      logger.warn('builder', 'No loaded configuration ID found - cannot auto-save');
      return false;
    }
    return true;
  }

  /**
   * Check if there's meaningful content to save
   */
  static hasMeaningfulContent(currentState: ReturnType<typeof uiBuilderStore.getState>): boolean {
    const hasContent = !!(
      currentState.selectedEcosystem ||
      currentState.selectedNetworkConfigId ||
      currentState.selectedFunction ||
      currentState.formConfig
    );

    if (!hasContent) {
      logger.info('builder', 'No meaningful content to auto-save yet');
    }

    return hasContent;
  }

  /**
   * Run all guard checks in sequence
   */
  static shouldProceedWithAutoSave(
    isLoadingSavedConfigRef: React.RefObject<boolean>,
    currentState: ReturnType<typeof uiBuilderStore.getState>
  ): { proceed: boolean; configId: string | null } {
    const configId = currentState.loadedConfigurationId;

    // Check loading states
    if (this.isLoadingBlocked(isLoadingSavedConfigRef, currentState)) {
      return { proceed: false, configId };
    }

    // Check config ID
    if (!this.hasValidConfigId(configId)) {
      return { proceed: false, configId };
    }

    // Check meaningful content
    if (!this.hasMeaningfulContent(currentState)) {
      return { proceed: false, configId };
    }

    return { proceed: true, configId };
  }
}
