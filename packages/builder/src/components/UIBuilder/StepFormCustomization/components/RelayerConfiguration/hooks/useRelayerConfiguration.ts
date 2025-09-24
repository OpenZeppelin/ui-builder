import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';

import type { ContractAdapter } from '@openzeppelin/ui-builder-types';

import { ExecutionMethodFormData } from '../../../types';

interface RelayerFormData {
  relayerServiceUrl: string;
  sessionApiKey: string;
  selectedRelayer: string;
}

export type SetupStep = 'credentials' | 'selection' | 'configuration';

interface UseRelayerConfigurationParams {
  control: UseFormReturn<ExecutionMethodFormData>['control'];
  adapter: ContractAdapter | null;
  setValue: UseFormReturn<ExecutionMethodFormData>['setValue'];
}

interface UseRelayerConfigurationReturn {
  setupStep: SetupStep;
  setSetupStep: (step: SetupStep) => void;
  localControl: UseFormReturn<RelayerFormData>['control'];
  sessionApiKey: string;
}

export function useRelayerConfiguration(
  _params: UseRelayerConfigurationParams
): UseRelayerConfigurationReturn {
  const [setupStep, setSetupStep] = useState<SetupStep>('credentials');

  // Create a local form for the API key
  const { control: localControl, watch } = useForm<RelayerFormData>({
    defaultValues: {
      sessionApiKey: '',
    },
    mode: 'onChange',
  });

  const sessionApiKey = watch('sessionApiKey');

  return {
    setupStep,
    setSetupStep,
    localControl,
    sessionApiKey,
  };
}
