import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { AddressField, LoadingButton } from '@openzeppelin/transaction-form-renderer';

import {
  getEcosystemExplorerGuidance,
  getEcosystemName,
} from '../../../../core/ecosystems/registry';
import { loadContractDefinition } from '../../../../services/ContractLoader';
import { StepTitleWithDescription } from '../../Common';
import { ContractAddressFormProps, ContractFormData } from '../types';

export function ContractAddressForm({
  adapter,
  networkConfig,
  isLoading,
  onLoadContract,
  setIsLoading,
  setError,
  error,
  existingContractAddress = null,
}: ContractAddressFormProps) {
  const { control, handleSubmit, watch, reset, setValue } = useForm<ContractFormData>({
    defaultValues: { contractAddress: existingContractAddress || '' },
    mode: 'onBlur',
  });

  // Update form values if existingContractAddress changes
  useEffect(() => {
    if (existingContractAddress) {
      setValue('contractAddress', existingContractAddress);
    }
  }, [existingContractAddress, setValue]);

  // Reset form when networkConfig (and thus adapter) changes
  useEffect(() => {
    if (!existingContractAddress) {
      reset({ contractAddress: '' });
      setError(null);
    }
  }, [networkConfig, reset, setError, existingContractAddress]);

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
        const schema = await loadContractDefinition(adapter, address);
        if (schema) {
          onLoadContract(schema);
        } else {
          setError(
            `Failed to load contract definition. Check the address and verify it's available on the ${getEcosystemName(networkConfig.ecosystem)} network.`
          );
        }
      } catch (err) {
        setError('An unexpected error occurred.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [adapter, networkConfig, onLoadContract, setIsLoading, setError]
  );

  const currentAddress = watch('contractAddress');
  const ecosystemName = getEcosystemName(networkConfig.ecosystem);
  const explorerGuidance = getEcosystemExplorerGuidance(networkConfig.ecosystem);

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmitAddress)(e)}
      className="flex flex-col space-y-6"
    >
      <StepTitleWithDescription
        title="Provide Contract Address"
        description={
          <>
            Enter the address of a verified contract on the {ecosystemName} network
            {explorerGuidance && ` (e.g., ${explorerGuidance})`}.
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
          placeholder={`Enter ${ecosystemName} contract address`}
        />

        <div>
          <LoadingButton type="submit" loading={isLoading} disabled={isLoading || !currentAddress}>
            {existingContractAddress ? 'Reload Contract' : 'Load Contract'}
          </LoadingButton>
        </div>
        {error && <p className="text-destructive pt-1 text-sm">{error}</p>}
      </div>
    </form>
  );
}
