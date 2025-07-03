import { AlertCircle, Info, Key, Shield, User } from 'lucide-react';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import type {
  EoaExecutionConfig,
  ExecutionConfig,
  RelayerExecutionConfig,
} from '@openzeppelin/transaction-form-types';
import {
  AddressDisplay,
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  PasswordField,
} from '@openzeppelin/transaction-form-ui';
import { cn } from '@openzeppelin/transaction-form-utils';

interface ExecutionConfigDisplayProps {
  executionConfig: ExecutionConfig;
  error?: string | null;
  onRuntimeApiKeyChange?: (apiKey: string) => void;
}

interface ApiKeyFormData {
  runtimeApiKey: string;
}

const EoaConfigDetails: React.FC<{ config: EoaExecutionConfig }> = ({ config }) => (
  <div className="space-y-4">
    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-md">
      <User className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="text-sm font-medium mb-1">Externally Owned Account (EOA)</h4>
        <p className="text-sm text-muted-foreground">
          Transaction will be executed directly from the connected wallet.
        </p>
      </div>
    </div>

    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-md">
      <Key className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="text-sm font-medium mb-1">Execution Restrictions</h4>
        <p className="text-sm text-muted-foreground">
          {config.allowAny
            ? 'Any connected wallet can try to execute this transaction.'
            : config.specificAddress
              ? 'Only this address can try to execute this transaction:'
              : 'No specific address restrictions defined.'}
        </p>
        {config.specificAddress && !config.allowAny && (
          <AddressDisplay className="mt-2" address={config.specificAddress} />
        )}
      </div>
    </div>
  </div>
);

const RelayerConfigDetails: React.FC<{ config: RelayerExecutionConfig }> = ({ config }) => (
  <div className="space-y-4">
    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-md">
      <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="text-sm font-medium mb-1">OpenZeppelin Relayer</h4>
        <p className="text-sm text-muted-foreground">
          Transaction will be sent via the selected OpenZeppelin Relayer.
        </p>
      </div>
    </div>

    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-md">
      <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="text-sm font-medium mb-1">Relayer Details</h4>
        <p className="text-sm text-muted-foreground">Name: {config.relayer.name}</p>
        <AddressDisplay className="mt-2" address={config.relayer.address} />
      </div>
    </div>
  </div>
);

// TODO: Implement display for RelayerExecutionConfig and MultisigExecutionConfig
// const RelayerConfigDetails: React.FC<{ config: RelayerExecutionConfig }> = ...
// const MultisigConfigDetails: React.FC<{ config: MultisigExecutionConfig }> = ...

export const ExecutionConfigDisplay: React.FC<ExecutionConfigDisplayProps> = ({
  executionConfig,
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

  // Notify parent component when API key changes
  useEffect(() => {
    onRuntimeApiKeyChange?.(runtimeApiKey);
  }, [runtimeApiKey, onRuntimeApiKeyChange]);

  let content: React.ReactNode;
  let methodIcon: React.ReactNode;

  switch (executionConfig.method) {
    case 'eoa':
      content = <EoaConfigDetails config={executionConfig as EoaExecutionConfig} />;
      methodIcon = <User className="h-3.5 w-3.5 text-primary" />;
      break;
    case 'relayer':
      content = <RelayerConfigDetails config={executionConfig as RelayerExecutionConfig} />;
      methodIcon = <Shield className="h-3.5 w-3.5 text-primary" />;
      break;
    // TODO: Add cases for 'multisig' with appropriate icons
    // case 'multisig':
    //   content = <MultisigConfigDetails config={executionConfig as MultisigExecutionConfig} />;
    //   methodIcon = <Users className="h-3.5 w-3.5 text-primary" />;
    //   break;
    default:
      content = <p className="text-sm text-muted-foreground">Unknown execution method.</p>;
      methodIcon = <Shield className="h-3.5 w-3.5 text-muted" />;
  }

  return (
    <Dialog>
      <div className="flex justify-end w-full">
        <DialogTrigger
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md border group',
            'transition-all duration-200 hover:bg-accent hover:text-accent-foreground',
            error
              ? 'border-red-300 bg-red-50 text-red-800 hover:bg-red-50/80'
              : 'border-slate-200 bg-white text-slate-700'
          )}
        >
          <div className="flex items-center gap-1.5">
            {methodIcon}
            <span className="font-semibold">Execution:</span>
            <span className="uppercase">{executionConfig.method}</span>
          </div>

          <div className="flex items-center ml-2">
            {error ? (
              <AlertCircle className="size-3.5 text-red-500" />
            ) : (
              <Info className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
            )}
          </div>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              Execution Method
              {error && <AlertCircle className="h-5 w-5 text-red-500" />}
            </DialogTitle>
          </div>
          <DialogDescription className="mt-2">
            This outlines how the transaction will be signed and submitted to the blockchain.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">{content}</div>

        {executionConfig.method === 'relayer' && (
          <PasswordField
            id="runtime-api-key"
            label="Relayer API Key"
            name="runtimeApiKey"
            control={control}
            placeholder="Enter your API key"
            helperText="This key is required to send the transaction and is not stored."
          />
        )}

        {error && (
          <div className="mb-2">
            <Alert variant="destructive" className="p-3 border border-red-300">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <AlertDescription className="pl-2 text-sm">{error}</AlertDescription>
              </div>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
