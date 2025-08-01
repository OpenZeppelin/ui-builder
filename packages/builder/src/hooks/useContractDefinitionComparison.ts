import { useCallback, useState } from 'react';

import { useWalletState } from '@openzeppelin/contracts-ui-builder-react-core';
// Import the correct interface from types package
import type { ContractDefinitionComparisonResult } from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

/**
 * State for contract definition comparison operations
 */
export interface ContractDefinitionComparisonState {
  /** Current comparison result */
  comparisonResult: ContractDefinitionComparisonResult | null;
  /** Whether a comparison is currently running */
  isComparing: boolean;
  /** Error from last comparison attempt */
  error: string | null;
  /** Set of dismissed warning IDs for persistence */
  dismissedWarnings: Set<string>;
  /** Last compared schemas for reference */
  lastComparison: {
    storedDefinition: string;
    freshDefinition: string;
    timestamp: Date;
  } | null;
}

/**
 * Hook for managing contract definition comparison operations and state
 * Provides functionality to compare contract definitions (raw ABI, IDL, etc.), manage warnings, and track dismissals
 */
export function useContractDefinitionComparison() {
  const { activeAdapter } = useWalletState();

  // State management
  const [state, setState] = useState<ContractDefinitionComparisonState>({
    comparisonResult: null,
    isComparing: false,
    error: null,
    dismissedWarnings: new Set(),
    lastComparison: null,
  });

  /**
   * Compare two contract schemas and update state with results
   *
   * @param storedSchema - Previously stored contract schema
   * @param freshSchema - Newly fetched contract schema
   * @returns Promise resolving to comparison result
   */
  const compareDefinitions = useCallback(
    async (
      storedDefinition: string,
      freshDefinition: string
    ): Promise<ContractDefinitionComparisonResult | null> => {
      // Check if adapter supports definition comparison
      if (!activeAdapter?.compareContractDefinitions) {
        logger.warn(
          'Contract Definition Comparison',
          'Current adapter does not support contract definition comparison'
        );
        return null;
      }

      setState((prev) => ({
        ...prev,
        isComparing: true,
        error: null,
      }));

      try {
        logger.info('Contract Definition Comparison', 'Starting definition comparison');

        const result = await activeAdapter.compareContractDefinitions(
          storedDefinition,
          freshDefinition
        );

        const formattedResult: ContractDefinitionComparisonResult = {
          identical: result.identical,
          differences: result.differences,
          severity: result.severity,
          summary: result.summary,
        };

        // Update state with comparison result
        setState((prev) => ({
          ...prev,
          comparisonResult: formattedResult,
          isComparing: false,
          lastComparison: {
            storedDefinition,
            freshDefinition,
            timestamp: new Date(),
          },
        }));

        logger.info(
          'Contract Definition Comparison',
          `Comparison completed: ${formattedResult.identical ? 'identical' : `${formattedResult.differences.length} differences (${formattedResult.severity})`}`
        );

        return formattedResult;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        setState((prev) => ({
          ...prev,
          isComparing: false,
          error: errorMessage,
          comparisonResult: null,
        }));

        logger.error('Contract Definition Comparison', `Comparison failed: ${errorMessage}`);
        return null;
      }
    },
    [activeAdapter]
  );

  /**
   * Validate a contract definition structure
   *
   * @param definition - Contract definition to validate (raw ABI, IDL, etc.)
   * @returns Validation result with errors and warnings
   */
  const validateDefinition = useCallback(
    (
      definition: string
    ): {
      valid: boolean;
      errors: string[];
      warnings: string[];
    } => {
      if (!activeAdapter?.validateContractDefinition) {
        logger.warn(
          'Contract Schema Validation',
          'Current adapter does not support contract schema validation'
        );
        return { valid: true, errors: [], warnings: [] };
      }

      try {
        return activeAdapter.validateContractDefinition(definition);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error('Contract Definition Validation', `Validation failed: ${errorMessage}`);
        return {
          valid: false,
          errors: [errorMessage],
          warnings: [],
        };
      }
    },
    [activeAdapter]
  );

  /**
   * Generate a hash for quick definition comparison
   *
   * @param definition - Contract definition to hash
   * @returns Hash string or null if not supported
   */
  const hashDefinition = useCallback(
    (definition: string): string | null => {
      if (!activeAdapter?.hashContractDefinition) {
        logger.warn(
          'Contract Definition Hashing',
          'Current adapter does not support contract definition hashing'
        );
        return null;
      }

      try {
        return activeAdapter.hashContractDefinition(definition);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error('Contract Schema Hashing', `Hashing failed: ${errorMessage}`);
        return null;
      }
    },
    [activeAdapter]
  );

  /**
   * Dismiss a warning for a specific record
   * Warnings are identified by a combination of record ID and schema hash
   *
   * @param recordId - ID of the contract UI record
   * @param definitionHash - Hash of the definition that triggered the warning
   */
  const dismissWarning = useCallback((recordId: string, definitionHash: string) => {
    const warningId = `${recordId}:${definitionHash}`;

    setState((prev) => ({
      ...prev,
      dismissedWarnings: new Set([...prev.dismissedWarnings, warningId]),
    }));

    logger.info('Contract Definition Comparison', `Warning dismissed for record ${recordId}`);
  }, []);

  /**
   * Check if a warning has been dismissed
   *
   * @param recordId - ID of the contract UI record
   * @param definitionHash - Hash of the definition
   * @returns True if warning has been dismissed
   */
  const isWarningDismissed = useCallback(
    (recordId: string, definitionHash: string): boolean => {
      const warningId = `${recordId}:${definitionHash}`;
      return state.dismissedWarnings.has(warningId);
    },
    [state.dismissedWarnings]
  );

  /**
   * Clear all dismissed warnings
   */
  const clearDismissedWarnings = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dismissedWarnings: new Set(),
    }));

    logger.info('Contract Definition Comparison', 'All dismissed warnings cleared');
  }, []);

  /**
   * Reset comparison state
   */
  const resetComparison = useCallback(() => {
    setState((prev) => ({
      ...prev,
      comparisonResult: null,
      error: null,
      lastComparison: null,
    }));

    logger.info('Contract Definition Comparison', 'Comparison state reset');
  }, []);

  /**
   * Check if current adapter supports definition comparison
   */
  const supportsComparison = useCallback((): boolean => {
    return !!(
      activeAdapter?.compareContractDefinitions &&
      activeAdapter?.validateContractDefinition &&
      activeAdapter?.hashContractDefinition
    );
  }, [activeAdapter]);

  return {
    // State
    comparisonResult: state.comparisonResult,
    isComparing: state.isComparing,
    error: state.error,
    lastComparison: state.lastComparison,
    dismissedWarnings: state.dismissedWarnings,

    // Actions
    compareDefinitions,
    validateDefinition,
    hashDefinition,
    dismissWarning,
    isWarningDismissed,
    clearDismissedWarnings,
    resetComparison,
    supportsComparison,
  };
}
