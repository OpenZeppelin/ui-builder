import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { Speed } from '@openzeppelin/relayer-sdk';
import {
  gweiToWei,
  weiToGwei,
  type EvmRelayerTransactionOptions,
} from '@openzeppelin/ui-builder-adapter-evm-core';

export interface EvmRelayerFormData {
  transactionOptions: EvmRelayerTransactionOptions & {
    showGasLimit?: boolean;
  };
}

interface UseEvmRelayerOptionsProps {
  options: Record<string, unknown>;
  onChange: (options: Record<string, unknown>) => void;
}

export const useEvmRelayerOptions = ({ options, onChange }: UseEvmRelayerOptionsProps) => {
  // Store latest onChange in a ref to avoid effect re-runs due to changing function identity
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Initialize form with options from parent (only on mount to prevent loops)
  const initialOptions = {
    speed: (() => {
      const hasCustomSettings = Boolean(
        options.gasPrice || options.maxFeePerGas || options.maxPriorityFeePerGas
      );
      return options.speed || (!hasCustomSettings ? Speed.FAST : undefined);
    })() as Speed,
    gasPrice: weiToGwei(options.gasPrice as number | undefined),
    maxFeePerGas: weiToGwei(options.maxFeePerGas as number | undefined),
    maxPriorityFeePerGas: weiToGwei(options.maxPriorityFeePerGas as number | undefined),
    gasLimit: options.gasLimit as number | undefined,
    showGasLimit: Boolean(options.gasLimit),
  };

  const { control, setValue, watch } = useForm<EvmRelayerFormData>({
    defaultValues: {
      transactionOptions: initialOptions,
    },
  });

  const formValues = watch('transactionOptions');
  const isInitialMount = useRef(true);

  // Determine current mode and gas type
  const hasCustomSettings = Boolean(
    formValues.gasPrice || formValues.maxFeePerGas || formValues.maxPriorityFeePerGas
  );
  const configMode = hasCustomSettings ? 'custom' : 'speed';
  const isEip1559 = Boolean(formValues.maxFeePerGas || formValues.maxPriorityFeePerGas);
  const gasType = isEip1559 ? 'eip1559' : 'legacy';

  // Handle initial mount - ensure the default speed value is communicated to parent
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;

      // Only notify parent if we have a default speed value that wasn't already in options
      if (initialOptions.speed && !options.speed) {
        const newOptions: EvmRelayerTransactionOptions = {};
        if (initialOptions.speed) newOptions.speed = initialOptions.speed;
        if (initialOptions.gasLimit) newOptions.gasLimit = initialOptions.gasLimit;

        onChange(newOptions as Record<string, unknown>);
      }
      return;
    }
  }, []);

  // Notify parent of changes after initial mount (watch specific fields to avoid loops)
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const newOptions: EvmRelayerTransactionOptions = {};

      if (formValues.speed) newOptions.speed = formValues.speed;
      if (formValues.gasPrice) newOptions.gasPrice = gweiToWei(formValues.gasPrice);
      if (formValues.maxFeePerGas) newOptions.maxFeePerGas = gweiToWei(formValues.maxFeePerGas);
      if (formValues.maxPriorityFeePerGas) {
        newOptions.maxPriorityFeePerGas = gweiToWei(formValues.maxPriorityFeePerGas);
      }
      if (formValues.gasLimit) newOptions.gasLimit = formValues.gasLimit;

      onChangeRef.current(newOptions as Record<string, unknown>);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [
    formValues.speed,
    formValues.gasPrice,
    formValues.maxFeePerGas,
    formValues.maxPriorityFeePerGas,
    formValues.gasLimit,
  ]);

  // Event handlers
  const handleSpeedChange = (speed: Speed) => {
    setValue('transactionOptions', {
      ...formValues,
      speed,
      gasPrice: undefined,
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
    });
  };

  const handleModeChange = (mode: string) => {
    if (mode === 'speed') {
      setValue('transactionOptions', {
        ...formValues,
        speed: Speed.FAST,
        gasPrice: undefined,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
      });
    } else {
      setValue('transactionOptions', {
        ...formValues,
        speed: undefined,
        maxFeePerGas: 30,
        maxPriorityFeePerGas: 2,
      });
    }
  };

  const handleGasTypeSwitch = (type: string) => {
    if (type === 'eip1559') {
      setValue('transactionOptions', {
        ...formValues,
        gasPrice: undefined,
        maxFeePerGas: 30,
        maxPriorityFeePerGas: 2,
      });
    } else {
      setValue('transactionOptions', {
        ...formValues,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        gasPrice: 20,
      });
    }
  };

  return {
    control,
    formValues,
    configMode,
    gasType,
    handleSpeedChange,
    handleModeChange,
    handleGasTypeSwitch,
  };
};
