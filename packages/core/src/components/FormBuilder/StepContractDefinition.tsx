import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AddressField, Label, LoadingButton } from '@openzeppelin/transaction-form-renderer';

import { getContractAdapter } from '../../adapters/index.ts';
import { getChainName } from '../../core/utils/utils';
import { loadContractDefinition } from '../../services/ContractLoader';

import { MockContractSelector } from './MockContractSelector';

import type { ChainType, ContractSchema } from '../../core/types/ContractSchema';

interface StepContractDefinitionProps {
  onContractSchemaLoaded: (schema: ContractSchema) => void;
  selectedChain: ChainType;
}

interface ContractFormData {
  contractAddress: string;
}

export function StepContractDefinition({
  onContractSchemaLoaded,
  selectedChain,
}: StepContractDefinitionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, watch, reset } = useForm<ContractFormData>({
    defaultValues: { contractAddress: '' },
  });

  useEffect(() => {
    reset({ contractAddress: '' });
    setError(null);
    setIsLoading(false);
  }, [selectedChain, reset]);

  const adapter = getContractAdapter(selectedChain);

  const onSubmitAddress = useCallback(
    async (data: ContractFormData) => {
      const address = data.contractAddress;
      if (!address) {
        setError('Please enter a contract address.');
        return;
      }
      setIsLoading(true);
      setError(null);

      try {
        const schema = await loadContractDefinition(selectedChain, address);
        if (schema) {
          onContractSchemaLoaded(schema);
        } else {
          setError(
            'Failed to load contract definition. Check address, network, and Etherscan verification.'
          );
        }
      } catch (err) {
        setError('An unexpected error occurred.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedChain, onContractSchemaLoaded]
  );

  const handleLoadMockData = useCallback(
    (mockId: string) => {
      setIsLoading(true);
      setError(null);
      reset({ contractAddress: '' });

      try {
        adapter
          .loadMockContract(mockId)
          .then((contractSchema: ContractSchema) => {
            onContractSchemaLoaded(contractSchema);
          })
          .catch((err: Error) => {
            setError(`Failed to load mock contract: ${err.message}`);
          })
          .finally(() => setIsLoading(false));
      } catch (err: unknown) {
        setError('Adapter error loading mock data.');
        setIsLoading(false);
      }
    },
    [selectedChain, onContractSchemaLoaded, reset, adapter]
  );

  const currentAddress = watch('contractAddress');

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmitAddress)(e)}
      className="flex flex-col space-y-6"
    >
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Provide Contract Address (EVM)</h3>
        <p className="text-muted-foreground text-sm">
          Enter the address of a verified contract on {getChainName(selectedChain)} (e.g.,
          Etherscan) or load mock data.
        </p>
      </div>

      <div className="grid gap-4">
        <AddressField
          id="contract-address"
          name="contractAddress"
          label="Contract Address"
          control={control}
          adapter={adapter}
          validation={{ required: true }}
          placeholder={`Enter ${getChainName(selectedChain)} contract address (e.g., 0x...)`}
        />

        <div className="flex items-end justify-between gap-4">
          <LoadingButton
            type="submit"
            loading={isLoading}
            disabled={isLoading || !currentAddress}
            className="w-1/2"
          >
            Load ABI from Address
          </LoadingButton>

          <div className="flex flex-col items-end text-right">
            <Label className="text-muted-foreground mb-1 text-xs">Or load mock:</Label>
            <MockContractSelector onSelectMock={handleLoadMockData} chainType={selectedChain} />
          </div>
        </div>
        {error && <p className="text-destructive pt-1 text-sm">{error}</p>}
      </div>
    </form>
  );
}
