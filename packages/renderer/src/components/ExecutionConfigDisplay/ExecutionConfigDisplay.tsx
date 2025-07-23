import { AlertCircle, AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type {
  ContractAdapter,
  EoaExecutionConfig,
  ExecutionConfig,
  RelayerDetailsRich,
  RelayerExecutionConfig,
} from '@openzeppelin/contracts-ui-builder-types';
import {
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  EmptyState,
  PasswordField,
} from '@openzeppelin/contracts-ui-builder-ui';

import { EoaConfigDetails } from './components/EoaConfigDetails';
import { ExecutionMethodTrigger } from './components/ExecutionMethodTrigger';
import { RelayerConfigDetails } from './components/RelayerConfigDetails';
import { useExecutionValidation } from './hooks/useExecutionValidation';

interface ExecutionConfigDisplayProps {
  executionConfig: ExecutionConfig;
  adapter?: ContractAdapter;
  error?: string | null;
  connectedWalletAddress?: string;
  onRuntimeApiKeyChange?: (apiKey: string) => void;
}

interface ApiKeyFormData {
  runtimeApiKey: string;
}

export const ExecutionConfigDisplay: React.FC<ExecutionConfigDisplayProps> = ({
  executionConfig,
  adapter,
  error,
  onRuntimeApiKeyChange,
}) => {
  // Create a local form for the API key
  const { control, watch } = useForm<ApiKeyFormData>({
    defaultValues: {
      runtimeApiKey: '',
    },
  });

  const runtimeApiKey = watch('runtimeApiKey');

  // State for dialog open/close
  const [isOpen, setIsOpen] = useState(false);

  // State for enhanced relayer details
  const [enhancedRelayerDetails, setEnhancedRelayerDetails] = useState<RelayerDetailsRich | null>(
    null
  );
  const [relayerDetailsLoading, setRelayerDetailsLoading] = useState(false);

  // Use the validation hook to determine if the execution config is valid
  const { isValid, error: validationError } = useExecutionValidation({
    executionConfig,
    adapter,
    runtimeApiKey,
  });

  // Notify parent component when API key changes
  useEffect(() => {
    onRuntimeApiKeyChange?.(runtimeApiKey);
  }, [runtimeApiKey, onRuntimeApiKeyChange]);

  // Fetch enhanced relayer details when dialog opens and it's a relayer execution
  useEffect(() => {
    if (isOpen && executionConfig.method === 'relayer' && runtimeApiKey && adapter?.getRelayer) {
      const relayerConfig = executionConfig as RelayerExecutionConfig;
      setRelayerDetailsLoading(true);

      adapter
        .getRelayer(relayerConfig.serviceUrl, runtimeApiKey, relayerConfig.relayer.relayerId)
        .then((details) => {
          setEnhancedRelayerDetails(details);
        })
        .catch((err) => {
          console.error('Failed to fetch enhanced relayer details:', err);
          // Keep using basic details if enhanced fetch fails
          setEnhancedRelayerDetails(null);
        })
        .finally(() => {
          setRelayerDetailsLoading(false);
        });
    }
  }, [isOpen, executionConfig, runtimeApiKey, adapter]);

  // Determine the content to display based on execution method
  const getExecutionContent = (): React.ReactNode => {
    switch (executionConfig.method) {
      case 'eoa':
        return <EoaConfigDetails config={executionConfig as EoaExecutionConfig} />;
      case 'relayer':
        return (
          <RelayerConfigDetails
            config={executionConfig as RelayerExecutionConfig}
            enhancedDetails={enhancedRelayerDetails}
            loading={relayerDetailsLoading}
          />
        );
      // TODO: Add cases for 'multisig' when implemented
      // case 'multisig':
      //   return <MultisigConfigDetails config={executionConfig as MultisigExecutionConfig} />;
      default:
        return (
          <EmptyState
            icon={<AlertTriangle className="h-6 w-6 text-muted-foreground" />}
            title="Unknown Execution Method"
            description="The selected execution method is not recognized. Please check your configuration or contact support."
            size="small"
          />
        );
    }
  };

  // Use validation error if present, otherwise use prop error
  const displayError = validationError || error || undefined;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex justify-end w-full">
        <ExecutionMethodTrigger
          executionConfig={executionConfig}
          isValid={isValid}
          error={displayError}
        />
      </div>

      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              Execution Method
              {displayError && <AlertCircle className="h-5 w-5 text-red-500" />}
            </DialogTitle>
          </div>
          <DialogDescription className="mt-2">
            This outlines how the transaction will be signed and submitted to the blockchain.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-grow">
          <div className="p-6">{getExecutionContent()}</div>

          {executionConfig.method === 'relayer' && (
            <div className="px-6 pb-4">
              <PasswordField
                id="runtime-api-key"
                label="Relayer API Key"
                name="runtimeApiKey"
                control={control}
                placeholder="Enter your API key"
                validation={{ required: true }}
                helperText="This key is required to send the transaction and is not stored."
              />
            </div>
          )}

          {displayError && (
            <div className="px-6 pb-4">
              <Alert variant="destructive" className="p-3 border border-red-300">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <AlertDescription className="pl-2 text-sm">{displayError}</AlertDescription>
                </div>
              </Alert>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
