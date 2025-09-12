import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { StellarRelayerTransactionOptions } from '../relayer';

export interface StellarRelayerFormData {
  transactionOptions: StellarRelayerTransactionOptions;
}

interface UseStellarRelayerOptionsProps {
  options: Record<string, unknown>;
  onChange: (options: Record<string, unknown>) => void;
}

export const useStellarRelayerOptions = ({ options, onChange }: UseStellarRelayerOptionsProps) => {
  // Store the latest onChange callback in a ref to avoid dependency issues
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Initialize form with options from parent (only on mount to prevent loops)
  const initialOptions: StellarRelayerTransactionOptions = {
    maxFee: options.maxFee as number | undefined,
    validUntil: options.validUntil as string | undefined,
    feeBump: options.feeBump as boolean | undefined,
  };

  const { control, setValue, watch } = useForm<StellarRelayerFormData>({
    defaultValues: {
      transactionOptions: initialOptions,
    },
  });

  const formValues = watch('transactionOptions');
  const isInitialMount = useRef(true);

  // Track user's intended mode (separate from auto-detection)
  const [userMode, setUserMode] = useState<'basic' | 'advanced'>(() => {
    // Determine initial mode based on existing settings
    const hasAdvancedSettings = Boolean(formValues.validUntil || formValues.feeBump);
    return hasAdvancedSettings ? 'advanced' : 'basic';
  });

  const configMode = userMode;

  // Handle initial mount - ensure any default values are communicated to parent
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // No default values to set for Stellar (unlike EVM's Speed.FAST)
      return;
    }
  }, []);

  // Notify parent of changes after initial mount - watch specific fields
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const newOptions: StellarRelayerTransactionOptions = {};

      // Set maxFee if provided
      if (formValues.maxFee !== undefined && formValues.maxFee !== null) {
        newOptions.maxFee = formValues.maxFee;
      }

      // Set validUntil if provided (check for actual date string, not just truthy)
      if (formValues.validUntil && formValues.validUntil.trim() !== '') {
        newOptions.validUntil = formValues.validUntil;
      }

      // Set feeBump if enabled
      if (formValues.feeBump !== undefined) {
        newOptions.feeBump = formValues.feeBump;
      }

      // Soroban transactions do not support memos; do not propagate any

      onChangeRef.current(newOptions as Record<string, unknown>);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [formValues.maxFee, formValues.validUntil, formValues.feeBump]);

  // Event handlers
  const handleModeChange = (mode: string) => {
    const newMode = mode as 'basic' | 'advanced';
    setUserMode(newMode);

    if (newMode === 'basic') {
      // Reset advanced options when switching to basic mode
      setValue('transactionOptions', {
        ...formValues,
        validUntil: undefined,
        feeBump: undefined,
      });
    } else {
      // When switching to advanced mode, keep existing values or set reasonable defaults
      setValue('transactionOptions', {
        ...formValues,
        validUntil: formValues.validUntil || undefined,
        feeBump: formValues.feeBump || false,
      });
    }
  };

  return {
    control,
    formValues,
    configMode,
    handleModeChange,
  };
};
