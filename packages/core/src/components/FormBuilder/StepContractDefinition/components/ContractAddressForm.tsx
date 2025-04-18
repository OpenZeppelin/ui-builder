import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { AddressField, Label, LoadingButton } from '@openzeppelin/transaction-form-renderer';

import { getContractAdapter } from '../../../../adapters/index';
import { getChainExplorerGuidance, getChainName } from '../../../../core/chains';
import { loadContractDefinition } from '../../../../services/ContractLoader';
import { StepTitleWithDescription } from '../../Common';
import { MockContractSelector } from '../../MockContractSelector';
import { ContractAddressFormProps, ContractFormData } from '../types';

export function ContractAddressForm({
  selectedChain,
  isLoading,
  onLoadContract,
  setIsLoading,
  setError,
  error,
}: ContractAddressFormProps) {
  const { control, handleSubmit, watch, reset } = useForm<ContractFormData>({
    defaultValues: { contractAddress: '' },
    mode: 'onBlur',
  });

  useEffect(() => {
    reset({ contractAddress: '' });
    setError(null);
  }, [selectedChain, reset, setError]);

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
          onLoadContract(schema);
        } else {
          setError(
            `Failed to load contract definition. Check the address and verify it's available on the ${getChainName(selectedChain)} network.`
          );
        }
      } catch (err) {
        setError('An unexpected error occurred.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedChain, onLoadContract, setIsLoading, setError]
  );

  const handleLoadMockData = useCallback(
    (mockId: string) => {
      setIsLoading(true);
      setError(null);
      reset({ contractAddress: '' });

      try {
        adapter
          .loadMockContract(mockId)
          .then((contractSchema) => {
            onLoadContract(contractSchema);
          })
          .catch((err: Error) => {
            setError(`Failed to load mock contract: ${err.message}`);
          })
          .finally(() => setIsLoading(false));
      } catch {
        setError('Adapter error loading mock data.');
        setIsLoading(false);
      }
    },
    [onLoadContract, reset, adapter, setIsLoading, setError]
  );

  const currentAddress = watch('contractAddress');
  const chainName = getChainName(selectedChain);
  const explorerGuidance = getChainExplorerGuidance(selectedChain);

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmitAddress)(e)}
      className="flex flex-col space-y-6"
    >
      <StepTitleWithDescription
        title="Provide Contract Address"
        description={
          <>
            Enter the address of a verified contract on the {chainName} network
            {explorerGuidance && ` (e.g., ${explorerGuidance})`} or load from mock data.
          </>
        }
      />

      <div className="grid gap-4">
        <AddressField
          id="contract-address"
          name="contractAddress"
          label="Contract Address"
          control={control}
          adapter={adapter}
          validation={{ required: true }}
          placeholder={`Enter ${chainName} contract address`}
        />

        <div className="flex items-end justify-between gap-4">
          <LoadingButton
            type="submit"
            loading={isLoading}
            disabled={isLoading || !currentAddress}
            className="w-1/2"
          >
            Load Contract
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
