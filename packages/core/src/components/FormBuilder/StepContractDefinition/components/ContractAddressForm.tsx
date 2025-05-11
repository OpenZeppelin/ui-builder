import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AddressField } from '@openzeppelin/transaction-form-renderer';
import { logger } from '@openzeppelin/transaction-form-utils';

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
  const [lastAttemptedAddress, setLastAttemptedAddress] = useState<string | null>(
    existingContractAddress
  );

  // Get current address value from form
  const currentAddress = watch('contractAddress');

  // Debounce the address input to avoid excessive loading attempts
  const debouncedAddress = useDebounce(currentAddress, 500);

  // Update form values if existingContractAddress changes
  useEffect(() => {
    if (existingContractAddress) {
      setValue('contractAddress', existingContractAddress);
      setLoadedAddress(existingContractAddress);
      setLastAttemptedAddress(existingContractAddress);
    }
  }, [existingContractAddress, setValue]);

  // Reset form when networkConfig (and thus adapter) changes
  useEffect(() => {
    if (!existingContractAddress) {
      reset({ contractAddress: '' });
      setError(null);
      setLoadedAddress(null);
      setLastAttemptedAddress(null);
    }
  }, [
    networkConfig,
    reset,
    setError,
    existingContractAddress,
    setLoadedAddress,
    setLastAttemptedAddress,
  ]);

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
    if (
      !debouncedAddress ||
      !isAddressValid ||
      loadingRef.current ||
      isLoading ||
      debouncedAddress === lastAttemptedAddress
    ) {
      return;
    }

    const loadContractFromAddress = async () => {
      setLastAttemptedAddress(debouncedAddress);
      setIsLoading(true);
      loadingRef.current = true;
      setError(null);

      try {
        logger.info('ContractAddressForm', `Attempting to load contract: ${debouncedAddress}`);
        const schema = await loadContractDefinition(adapter, debouncedAddress);
        logger.info('ContractAddressForm', `Successfully loaded contract: ${debouncedAddress}`);
        if (!schema) throw new Error('Internal error: Schema was null after successful load.');
        onLoadContract(schema);
        setLoadedAddress(debouncedAddress);
      } catch (err) {
        logger.error('ContractAddressForm', `Failed to load contract ${debouncedAddress}:`, err);
        const errorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred during contract loading.';
        setError(errorMessage);
        setLoadedAddress(null);
        onClearContract();
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
    onLoadContract,
    setIsLoading,
    setError,
    isLoading,
    lastAttemptedAddress,
    onClearContract,
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
