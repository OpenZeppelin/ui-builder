import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AddressField } from '@openzeppelin/transaction-form-renderer';

import {
  getEcosystemExplorerGuidance,
  getEcosystemName,
} from '../../../../core/ecosystems/registry';
import { loadContractDefinition } from '../../../../services/ContractLoader';
import { StepTitleWithDescription } from '../../Common';
import { ContractAddressFormProps, ContractFormData } from '../types';

/**
 * Debounce utility to delay contract loading
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay expires
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function ContractAddressForm({
  adapter,
  networkConfig,
  isLoading,
  onLoadContract,
  onClearContract,
  setIsLoading,
  setError,
  error,
  existingContractAddress = null,
}: ContractAddressFormProps) {
  const { control, watch, reset, setValue } = useForm<ContractFormData>({
    defaultValues: { contractAddress: existingContractAddress || '' },
    mode: 'onChange',
  });

  // Keep track of whether we're currently loading a contract
  const [isAddressValid, setIsAddressValid] = useState(false);
  const loadingRef = useRef(false);
  // Track the last successfully loaded address to prevent reloading the same contract
  const [loadedAddress, setLoadedAddress] = useState<string | null>(existingContractAddress);

  // Get current address value from form
  const currentAddress = watch('contractAddress');

  // Debounce the address input to avoid excessive loading attempts
  const debouncedAddress = useDebounce(currentAddress, 500);

  // Update form values if existingContractAddress changes
  useEffect(() => {
    if (existingContractAddress) {
      setValue('contractAddress', existingContractAddress);
      setLoadedAddress(existingContractAddress);
    }
  }, [existingContractAddress, setValue]);

  // Reset form when networkConfig (and thus adapter) changes
  useEffect(() => {
    if (!existingContractAddress) {
      reset({ contractAddress: '' });
      setError(null);
      setLoadedAddress(null);
    }
  }, [networkConfig, reset, setError, existingContractAddress]);

  // Check if address is valid using the adapter
  useEffect(() => {
    if (currentAddress && adapter?.isValidAddress) {
      const isValid = adapter.isValidAddress(currentAddress);
      setIsAddressValid(isValid);

      // If the address is no longer valid but we had a previously loaded address,
      // clear the contract data
      if (!isValid && loadedAddress) {
        onClearContract();
        setLoadedAddress(null);
      }
    } else {
      setIsAddressValid(false);

      // If the address is cleared and we had a previously loaded address,
      // clear the contract data
      if (loadedAddress && !currentAddress) {
        onClearContract();
        setLoadedAddress(null);
      }
    }
  }, [currentAddress, adapter, loadedAddress, onClearContract]);

  // Load contract when debounced address changes and is valid
  useEffect(() => {
    // Don't do anything if address is empty, invalid, already loaded, or we're already loading
    if (
      !debouncedAddress ||
      !isAddressValid ||
      loadingRef.current ||
      isLoading ||
      debouncedAddress === loadedAddress
    ) {
      return;
    }

    const loadContractFromAddress = async () => {
      // Set loading state and clear any previous errors
      setIsLoading(true);
      loadingRef.current = true;
      setError(null);

      try {
        const schema = await loadContractDefinition(adapter, debouncedAddress);
        if (schema) {
          onLoadContract(schema);
          setLoadedAddress(debouncedAddress);
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
        loadingRef.current = false;
      }
    };

    void loadContractFromAddress();
  }, [
    debouncedAddress,
    isAddressValid,
    adapter,
    networkConfig,
    onLoadContract,
    setIsLoading,
    setError,
    isLoading,
    loadedAddress,
  ]);

  const ecosystemName = getEcosystemName(networkConfig.ecosystem);
  const explorerGuidance = getEcosystemExplorerGuidance(networkConfig.ecosystem);

  return (
    <div className="flex flex-col space-y-6">
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
          helperText={
            isLoading
              ? 'Loading contract...'
              : 'Contract will load automatically when a valid address is entered'
          }
        />

        {error && <p className="text-destructive pt-1 text-sm">{error}</p>}
      </div>
    </div>
  );
}
