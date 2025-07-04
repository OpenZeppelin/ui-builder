import { AlertCircle } from 'lucide-react';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import type {
  ContractAdapter,
  EoaExecutionConfig,
  ExecutionConfig,
  RelayerExecutionConfig,
} from '@openzeppelin/transaction-form-types';
import {
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  PasswordField,
} from '@openzeppelin/transaction-form-ui';

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

  // Determine the content to display based on execution method
  const getExecutionContent = (): React.ReactNode => {
    switch (executionConfig.method) {
      case 'eoa':
        return <EoaConfigDetails config={executionConfig as EoaExecutionConfig} />;
      case 'relayer':
        return <RelayerConfigDetails config={executionConfig as RelayerExecutionConfig} />;
      // TODO: Add cases for 'multisig' when implemented
      // case 'multisig':
      //   return <MultisigConfigDetails config={executionConfig as MultisigExecutionConfig} />;
      default:
        return <p className="text-sm text-muted-foreground">Unknown execution method.</p>;
    }
  };

  // Use validation error if present, otherwise use prop error
  const displayError = validationError || error || undefined;

  return (
    <Dialog>
      <div className="flex justify-end w-full">
        <ExecutionMethodTrigger
          executionConfig={executionConfig}
          isValid={isValid}
          error={displayError}
        />
      </div>

      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader className="border-b pb-4">
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

        <div className="py-4">{getExecutionContent()}</div>

        {executionConfig.method === 'relayer' && (
          <PasswordField
            id="runtime-api-key"
            label="Relayer API Key"
            name="runtimeApiKey"
            control={control}
            placeholder="Enter your API key"
            validation={{ required: true }}
            helperText="This key is required to send the transaction and is not stored."
          />
        )}

        {displayError && (
          <div className="mb-2">
            <Alert variant="destructive" className="p-3 border border-red-300">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <AlertDescription className="pl-2 text-sm">{displayError}</AlertDescription>
              </div>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
