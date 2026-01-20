import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Alert, AlertDescription, AlertTitle, Button } from '@openzeppelin/ui-components';
import type {
  ContractAdapter,
  ContractDefinitionComparisonResult,
  ContractSchema,
  ProxyInfo,
} from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { useContractUIStorage } from '../../../../contexts/useContractUIStorage';
import {
  ContractDefinitionComparisonModal,
  ContractDefinitionMismatchWarning,
  ContractDefinitionSourceIndicator,
  ProxyStatusIndicator,
} from '../../../warnings';
import type { UIBuilderActions, UIBuilderState } from '../../hooks/uiBuilderStore';
import { useUIBuilderStore } from '../../hooks/useUIBuilderStore';

interface ContractSuccessStatusProps {
  contractSchema: ContractSchema;
  contractDefinitionSource: 'fetched' | 'manual' | null;
  contractMetadata: {
    fetchedFrom?: string;
    fetchTimestamp?: Date;
    definitionHash?: string;
  };
  proxyInfo: ProxyInfo | null;
  ignoreProxy: boolean;
  definitionComparison?: {
    comparisonResult: ContractDefinitionComparisonResult;
  } | null;
  loadedConfigurationId: string | null;
  adapter: ContractAdapter;
  onIgnoreProxy: () => void;
  requiresManualReload: boolean;
  onManualReload: () => void;
  isReloading: boolean;
}

/**
 * Displays success state with contract information, proxy status, and definition indicators.
 *
 * The component shows contract definition mismatch warnings when the loaded contract
 * differs from a saved configuration. Users can permanently dismiss these warnings,
 * which updates the baseline contract definition to accept the current state.
 */
export function ContractSuccessStatus({
  contractSchema,
  contractDefinitionSource,
  contractMetadata,
  proxyInfo,
  ignoreProxy,
  definitionComparison,
  adapter,
  onIgnoreProxy,
  requiresManualReload,
  onManualReload,
  isReloading,
}: ContractSuccessStatusProps) {
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const { updateContractUI } = useContractUIStorage();

  const loadedConfigurationId = useUIBuilderStore(
    (state: UIBuilderState & UIBuilderActions) => state.loadedConfigurationId
  );

  const contractDefinitionJson = useUIBuilderStore(
    (state: UIBuilderState & UIBuilderActions) => state.contractState.definitionJson
  );

  const acceptCurrentContractDefinition = useUIBuilderStore(
    (state: UIBuilderState & UIBuilderActions) => state.acceptCurrentContractDefinition
  );

  const functionCount = contractSchema.functions.length;
  const contractName = contractSchema.name;
  const source = contractDefinitionSource || 'fetched';

  const successMessage =
    source === 'manual'
      ? `Contract ${contractName} processed successfully with ${functionCount} functions. Click "Next" to continue.`
      : `Contract ${contractName} loaded successfully with ${functionCount} functions. Click "Next" to continue.`;

  /**
   * Handle dismissing the contract definition mismatch warning permanently.
   * This directly updates the database record and then the store to ensure persistence.
   */
  const handleDismissWarning = async () => {
    if (!loadedConfigurationId || !contractDefinitionJson) {
      return;
    }

    try {
      // Directly update the database record to set the new baseline
      await updateContractUI(loadedConfigurationId, {
        contractDefinitionOriginal: contractDefinitionJson,
      });

      // Update the store state to reflect the change
      acceptCurrentContractDefinition();
    } catch (error) {
      logger.error('ContractSuccessStatus', 'Failed to accept contract definition changes:', error);
    }
  };

  // Memoize explorer URLs to prevent repeated calls to resolveExplorerConfig
  const proxyExplorerUrl = useMemo(
    () =>
      proxyInfo?.proxyAddress
        ? adapter?.getExplorerUrl(proxyInfo.proxyAddress) || undefined
        : undefined,
    [proxyInfo?.proxyAddress, adapter]
  );

  const implementationExplorerUrl = useMemo(
    () =>
      proxyInfo?.implementationAddress
        ? adapter?.getExplorerUrl(proxyInfo.implementationAddress) || undefined
        : undefined,
    [proxyInfo?.implementationAddress, adapter]
  );

  const adminExplorerUrl = useMemo(
    () =>
      proxyInfo?.adminAddress
        ? adapter?.getExplorerUrl(proxyInfo.adminAddress) || undefined
        : undefined,
    [proxyInfo?.adminAddress, adapter]
  );

  return (
    <div className="space-y-3">
      {/* Contract Definition Source Indicator */}
      <div className="flex justify-end">
        <ContractDefinitionSourceIndicator
          source={contractDefinitionSource || 'fetched'}
          fetchedFrom={contractMetadata?.fetchedFrom}
          lastFetched={contractMetadata?.fetchTimestamp}
          hasError={
            !!(
              definitionComparison?.comparisonResult &&
              definitionComparison.comparisonResult !== null &&
              !definitionComparison.comparisonResult.identical
            )
          }
        />
      </div>

      {/* Contract Definition Mismatch Warning */}
      {definitionComparison?.comparisonResult &&
        definitionComparison.comparisonResult !== null &&
        !definitionComparison.comparisonResult.identical && (
          <ContractDefinitionMismatchWarning
            comparison={definitionComparison.comparisonResult}
            onDismiss={() => {
              void handleDismissWarning();
            }}
            onViewDetails={() => {
              setIsComparisonModalOpen(true);
            }}
            className="mb-4"
          />
        )}

      {/* Proxy Status Indicator */}
      {proxyInfo?.isProxy && !ignoreProxy && (
        <ProxyStatusIndicator
          proxyInfo={proxyInfo}
          proxyExplorerUrl={proxyExplorerUrl}
          implementationExplorerUrl={implementationExplorerUrl}
          adminExplorerUrl={adminExplorerUrl}
          onIgnoreProxy={onIgnoreProxy}
        />
      )}

      {/* Success / Manual Reload Message */}
      {requiresManualReload ? (
        <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
          <div className="flex flex-1 flex-col gap-2">
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              Contract inputs changed
            </AlertTitle>
            <AlertDescription className="text-amber-900/80 dark:text-amber-100/80">
              The contract artifacts or required fields were modified. Reload to apply the updated
              contract before continuing.
            </AlertDescription>
            <div>
              <Button onClick={onManualReload} size="sm" disabled={isReloading} className="mt-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                {isReloading ? 'Reloading…' : 'Reload contract'}
              </Button>
            </div>
          </div>
        </Alert>
      ) : (
        <Alert variant="success" className="p-4">
          <CheckCircle className="size-5" />
          <AlertTitle>Contract loaded</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Contract Definition Comparison Modal */}
      {definitionComparison?.comparisonResult && (
        <ContractDefinitionComparisonModal
          open={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          comparison={definitionComparison.comparisonResult}
        />
      )}
    </div>
  );
}
