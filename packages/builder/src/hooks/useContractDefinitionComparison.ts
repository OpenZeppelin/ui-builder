import { useEffect, useState } from 'react';

import { abiComparisonService } from '@openzeppelin/contracts-ui-builder-adapter-evm';
// Import the correct interface from types package
import type {
  ContractDefinitionComparisonResult,
  ContractDefinitionDifference,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger } from '@openzeppelin/contracts-ui-builder-utils';

interface UseContractDefinitionComparisonProps {
  originalDefinition: string | null;
  currentDefinition: string | null;
  isLoadedConfigMode: boolean;
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

          const result = abiComparisonService.compareAbis(originalDefinition, currentDefinition);
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
    comparisonResult.identical,
    comparisonResult.differences.length,
  ]);

  return { comparisonResult };
}
