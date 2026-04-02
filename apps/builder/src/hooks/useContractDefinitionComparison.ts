import { useEffect, useState } from 'react';

// Import the correct interface from types package
import type {
  ContractDefinitionComparisonResult,
  ContractDefinitionDifference,
} from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import type { BuilderRuntime } from '@/core/runtimeAdapter';

interface UseContractDefinitionComparisonProps {
  originalDefinition: string | null;
  currentDefinition: string | null;
  isLoadedConfigMode: boolean;
  runtime?: BuilderRuntime | null;
}

interface UseContractDefinitionComparisonReturn {
  comparisonResult: ContractDefinitionComparisonResult;
}

/**
 * Hook for managing contract definition comparison operations and state
 * Automatically compares definitions when they change
 */
export function useContractDefinitionComparison({
  originalDefinition,
  currentDefinition,
  isLoadedConfigMode,
  runtime,
}: UseContractDefinitionComparisonProps): UseContractDefinitionComparisonReturn {
  const [comparisonResult, setComparisonResult] = useState<ContractDefinitionComparisonResult>({
    identical: true,
    differences: [],
    severity: 'none',
    summary: 'No differences detected',
  });

  useEffect(() => {
    // Only perform comparison if in loaded config mode and both definitions exist and are different
    if (
      isLoadedConfigMode &&
      originalDefinition &&
      currentDefinition &&
      originalDefinition !== currentDefinition
    ) {
      const performComparison = async () => {
        try {
          logger.info(
            'useContractDefinitionComparison',
            'Performing comparison due to definition change',
            JSON.stringify({
              originalLength: originalDefinition.length,
              currentLength: currentDefinition.length,
            })
          );
          if (!runtime?.contractLoading?.compareContractDefinitions) {
            logger.warn(
              'useContractDefinitionComparison',
              'Active runtime is missing compareContractDefinitions; skipping detailed comparison.'
            );
            setComparisonResult({
              identical: true,
              differences: [],
              severity: 'none',
              summary: 'Comparison not available for this chain/runtime',
            });
            return;
          }

          const result = await runtime.contractLoading.compareContractDefinitions(
            originalDefinition,
            currentDefinition
          );
          const differences = result.differences.map(
            (diff) =>
              ({
                type: diff.type,
                section: diff.section,
                name: diff.name,
                details: diff.details,
                impact: diff.impact,
                oldSignature: diff.oldSignature,
                newSignature: diff.newSignature,
              }) as ContractDefinitionDifference
          );

          const severity = result.severity;
          const summary = result.summary;

          setComparisonResult({
            identical: result.identical,
            differences,
            severity,
            summary,
          });
        } catch (error) {
          logger.error('useContractDefinitionComparison', 'Failed to compare definitions', error);
          setComparisonResult({
            identical: true,
            differences: [],
            severity: 'none',
            summary: `Error comparing definitions: ${String(error)}`,
          });
        }
      };
      void performComparison();
    } else {
      // If conditions for comparison are not met, reset the comparison state
      if (!comparisonResult.identical || comparisonResult.differences.length > 0) {
        logger.info('Contract Definition Comparison', 'Comparison state reset');
        setComparisonResult({
          identical: true,
          differences: [],
          severity: 'none',
          summary: 'No differences detected',
        });
      }
    }
  }, [
    originalDefinition,
    currentDefinition,
    isLoadedConfigMode,
    runtime,
    comparisonResult.identical,
    comparisonResult.differences.length,
  ]);

  return { comparisonResult };
}
