import React, { useCallback, useEffect } from 'react';
import { useWatch } from 'react-hook-form';

import type { RelayerDetails } from '@openzeppelin/ui-types';

import type { RelayerConfigurationProps } from '../../types';
import {
  RelayerCredentialsCard,
  RelayerGasConfigurationCard,
  RelayerHeader,
  RelayerSelectionCard,
} from './components';
import { useRelayerConfiguration, useRelayerDetails, useRelayerFetch } from './hooks';

export function RelayerConfiguration({
  control,
  adapter,
  setValue,
}: RelayerConfigurationProps): React.ReactElement {
  const { setupStep, setSetupStep, localControl, sessionApiKey } = useRelayerConfiguration({
    control,
    adapter,
    setValue,
  });

  const relayerServiceUrl =
    useWatch({
      control,
      name: 'relayerServiceUrl',
    }) || '';

  const selectedRelayerId =
    useWatch({
      control,
      name: 'selectedRelayer',
    }) || '';

  const transactionOptions =
    useWatch({
      control,
      name: 'transactionOptions',
    }) || {};

  // Handle relayer fetching
  const handleRelayersFetched = useCallback(
    (relayers: RelayerDetails[]) => {
      if (relayers.length > 0) {
        const firstRelayer = relayers[0];
        setValue('selectedRelayer', firstRelayer.relayerId, { shouldValidate: true });
        setValue('selectedRelayerDetails', firstRelayer, { shouldValidate: true });
        setValue('transactionOptions', { speed: 'fast' }, { shouldValidate: true });
        setSetupStep('selection');
      }
    },
    [setValue, setSetupStep]
  );

  const { fetchRelayers, fetchedRelayers, isLoading, error, clearError } = useRelayerFetch({
    adapter,
    onRelayersFetched: handleRelayersFetched,
  });

  // Handle enhanced relayer details
  const { enhancedDetails, loading: loadingEnhancedDetails } = useRelayerDetails({
    adapter,
    relayerId: selectedRelayerId,
    serviceUrl: relayerServiceUrl,
    apiKey: sessionApiKey,
    enabled: !!selectedRelayerId && !!sessionApiKey && !!relayerServiceUrl,
  });

  // Update selected relayer details when selection changes
  useEffect(() => {
    const selected = fetchedRelayers.find((r) => r.relayerId === selectedRelayerId);
    if (selected) {
      setValue('selectedRelayerDetails', selected, { shouldValidate: true });
    }
  }, [selectedRelayerId, fetchedRelayers, setValue]);

  const handleFetchRelayers = () => {
    clearError();
    setValue('selectedRelayer', '', { shouldValidate: true });
    setValue('selectedRelayerDetails', undefined, { shouldValidate: true });
    void fetchRelayers(relayerServiceUrl, sessionApiKey);
  };

  const isCredentialsComplete = !!(relayerServiceUrl && sessionApiKey);
  const isSelectionComplete = !!(selectedRelayerId && fetchedRelayers.length > 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <RelayerHeader />

      {/* Step 1: Credentials */}
      <RelayerCredentialsCard
        isActive={setupStep === 'credentials'}
        isComplete={isCredentialsComplete}
        relayerServiceUrl={relayerServiceUrl}
        sessionApiKey={sessionApiKey}
        isLoading={isLoading}
        error={error}
        control={control}
        localControl={localControl}
        onFetchRelayers={handleFetchRelayers}
        onEdit={() => setSetupStep('credentials')}
      />

      {/* Step 2: Relayer Selection */}
      {isCredentialsComplete && fetchedRelayers.length > 0 && (
        <RelayerSelectionCard
          isActive={setupStep === 'selection' || setupStep === 'configuration'}
          isComplete={isSelectionComplete}
          control={control}
          fetchedRelayers={fetchedRelayers}
          selectedRelayerId={selectedRelayerId}
          enhancedDetails={enhancedDetails}
          loadingEnhancedDetails={loadingEnhancedDetails}
          isLoading={isLoading}
          onEdit={() => setSetupStep('selection')}
          adapter={adapter}
        />
      )}

      {/* Step 3: Transaction Configuration */}
      {isSelectionComplete && adapter?.getRelayerOptionsComponent && (
        <RelayerGasConfigurationCard
          isActive={setupStep === 'configuration'}
          adapter={adapter}
          transactionOptions={transactionOptions}
          onSetupStepChange={setSetupStep}
          onTransactionOptionsChange={(newOptions) => {
            setValue('transactionOptions', newOptions, { shouldValidate: true });
          }}
        />
      )}
    </div>
  );
}

RelayerConfiguration.displayName = 'RelayerConfiguration';
