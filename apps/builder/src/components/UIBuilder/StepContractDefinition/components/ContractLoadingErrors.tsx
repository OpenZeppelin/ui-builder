import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@openzeppelin/ui-components';

interface ContractLoadingErrorsProps {
  validationError: string | null;
  contractDefinitionError: string | null;
  circuitBreakerActive: boolean;
  loadedConfigurationId: string | null;
}

/**
 * Displays all error states related to contract loading and validation
 */
export function ContractLoadingErrors({
  validationError,
  contractDefinitionError,
  circuitBreakerActive,
  loadedConfigurationId,
}: ContractLoadingErrorsProps) {
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

      {/* Contract Loading Error */}
      {contractDefinitionError && !validationError && (
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
