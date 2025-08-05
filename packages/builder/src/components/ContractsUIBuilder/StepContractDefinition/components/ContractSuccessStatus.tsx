import { CheckCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import type {
  ContractAdapter,
  ContractDefinitionComparisonResult,
  ContractSchema,
  ProxyInfo,
} from '@openzeppelin/contracts-ui-builder-types';

import {
  ContractDefinitionComparisonModal,
  ContractDefinitionMismatchWarning,
  ContractDefinitionSourceIndicator,
  ProxyStatusIndicator,
} from '../../../warnings';

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
}

/**
 * Displays success state with contract information, proxy status, and definition indicators
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
}: ContractSuccessStatusProps) {
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  const functionCount = contractSchema.functions.length;
  const contractName = contractSchema.name;
  const source = contractDefinitionSource || 'fetched';

  const successMessage =
    source === 'manual'
      ? `Contract ${contractName} processed successfully with ${functionCount} functions. Click "Next" to continue.`
      : `Contract ${contractName} loaded successfully with ${functionCount} functions. Click "Next" to continue.`;

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
              // TODO: Implement dismiss warning functionality
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
          onIgnoreProxy={onIgnoreProxy}
        />
      )}

      {/* Success Message */}
      <div className="rounded-md border border-green-200 bg-green-50 p-4">
        <p className="flex items-center text-green-800">
          <CheckCircle className="mr-2 size-5" />
          {successMessage}
        </p>
      </div>

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
