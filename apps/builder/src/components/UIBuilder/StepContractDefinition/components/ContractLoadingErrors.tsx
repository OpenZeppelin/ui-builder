import { AlertTriangle } from 'lucide-react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  NetworkServiceErrorBanner,
} from '@openzeppelin/ui-components';
import type { NetworkConfig } from '@openzeppelin/ui-types';
import { detectServiceType, isServiceConnectionError } from '@openzeppelin/ui-utils';

interface ContractLoadingErrorsProps {
  validationError: string | null;
  contractDefinitionError: string | null;
  circuitBreakerActive: boolean;
  loadedConfigurationId: string | null;
  /** Network configuration for showing service settings action */
  networkConfig?: NetworkConfig | null;
  /**
   * Optional hint about which service type failed.
   * If not provided, will attempt to detect from error message.
   */
  failedServiceType?: string;
}

/**
 * Displays all error states related to contract loading and validation.
 * Automatically detects network service connection errors and shows a specialized
 * banner with a call-to-action to configure the appropriate service settings.
 */
export function ContractLoadingErrors({
  validationError,
  contractDefinitionError,
  circuitBreakerActive,
  loadedConfigurationId,
  networkConfig,
  failedServiceType,
}: ContractLoadingErrorsProps) {
  const isServiceError = isServiceConnectionError(contractDefinitionError);
  const serviceType = failedServiceType || detectServiceType(contractDefinitionError);

  return (
    <div className="space-y-4">
      {/* Validation Error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Contract Definition Error</AlertTitle>
          <AlertDescription style={{ whiteSpace: 'pre-line' }}>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Network Service Connection Error - Show specialized banner */}
      {contractDefinitionError && !validationError && isServiceError && networkConfig && (
        <NetworkServiceErrorBanner
          networkConfig={networkConfig}
          serviceType={serviceType}
          errorMessage={contractDefinitionError}
        />
      )}

      {/* Contract Loading Error - Generic error (non-service related) */}
      {contractDefinitionError && !validationError && (!isServiceError || !networkConfig) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Contract Loading Error</AlertTitle>
          <AlertDescription>{contractDefinitionError}</AlertDescription>
        </Alert>
      )}

      {/* Circuit Breaker Error */}
      {circuitBreakerActive && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Too Many Failed Attempts</AlertTitle>
          <AlertDescription>
            Multiple loading attempts have failed. Please check your input and try again in a
            moment.
            {loadedConfigurationId &&
              ' This saved configuration appears to be corrupted - consider deleting and recreating it.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
