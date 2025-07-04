import { AlertCircle, Loader2 } from 'lucide-react';

import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { RelayerDetails, RelayerDetailsRich } from '@openzeppelin/transaction-form-types';
import {
  Alert,
  AlertDescription,
  Button,
  ExternalLink,
  PasswordField,
  RelayerDetailsCard,
  SelectField,
  UrlField,
} from '@openzeppelin/transaction-form-ui';
import { truncateMiddle } from '@openzeppelin/transaction-form-utils';

import type { RelayerConfigurationProps } from '../types';

interface RelayerFormData {
  relayerServiceUrl: string;
  sessionApiKey: string;
  selectedRelayer: string;
}

export function RelayerConfiguration({
  control,
  adapter,
  setValue,
}: RelayerConfigurationProps): React.ReactElement {
  const [fetchedRelayers, setFetchedRelayers] = useState<RelayerDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedRelayerDetails, setEnhancedRelayerDetails] = useState<RelayerDetailsRich | null>(
    null
  );
  const [loadingEnhancedDetails, setLoadingEnhancedDetails] = useState(false);

  // Create a local form for the API key
  const { control: localControl, watch } = useForm<RelayerFormData>({
    defaultValues: {
      sessionApiKey: '',
    },
    mode: 'onChange',
  });

  const relayerServiceUrl = useWatch({
    control,
    name: 'relayerServiceUrl',
  });

  const selectedRelayerId = useWatch({
    control,
    name: 'selectedRelayer',
  });

  const sessionApiKey = watch('sessionApiKey');

  useEffect(() => {
    const selected = fetchedRelayers.find((r) => r.relayerId === selectedRelayerId);
    if (selected) {
      setValue('selectedRelayerDetails', selected, { shouldValidate: true });
    }
  }, [selectedRelayerId, fetchedRelayers, setValue]);

  // Fetch enhanced details when a relayer is selected
  useEffect(() => {
    if (selectedRelayerId && sessionApiKey && relayerServiceUrl && adapter?.getRelayer) {
      setLoadingEnhancedDetails(true);
      adapter
        .getRelayer(relayerServiceUrl, sessionApiKey, selectedRelayerId)
        .then((details) => {
          setEnhancedRelayerDetails(details);
        })
        .catch((err) => {
          console.error('Failed to fetch enhanced relayer details:', err);
          setEnhancedRelayerDetails(null);
        })
        .finally(() => {
          setLoadingEnhancedDetails(false);
        });
    } else {
      setEnhancedRelayerDetails(null);
    }
  }, [selectedRelayerId, sessionApiKey, relayerServiceUrl, adapter]);

  const handleFetchRelayers = async () => {
    if (!adapter) {
      setError('Adapter is not available.');
      return;
    }

    if (!relayerServiceUrl || !sessionApiKey) {
      setError('Please provide both a service URL and an API Key.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFetchedRelayers([]);
    setEnhancedRelayerDetails(null);
    setValue('selectedRelayer', '', { shouldValidate: true });
    setValue('selectedRelayerDetails', undefined, { shouldValidate: true });

    try {
      const relayers = await adapter.getRelayers(relayerServiceUrl, sessionApiKey);
      if (relayers.length === 0) {
        setError('No compatible relayers found for the current network.');
      } else {
        setFetchedRelayers(relayers);
        // Automatically select the first relayer
        const firstRelayer = relayers[0];
        setValue('selectedRelayer', firstRelayer.relayerId, { shouldValidate: true });
        setValue('selectedRelayerDetails', firstRelayer, { shouldValidate: true });
      }
    } catch (e) {
      setError((e as Error).message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const relayerOptions = fetchedRelayers.map((r) => ({
    value: r.relayerId,
    label: `${r.name} (${truncateMiddle(r.address, 6, 4)})`,
    disabled: isLoading,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-base font-medium mb-2">Relayer Configuration</h4>
          <p className="text-sm text-muted-foreground">
            Connect to an OpenZeppelin Relayer service to enable gasless transactions.
          </p>
        </div>
        <ExternalLink href="https://docs.openzeppelin.com/relayer" className="text-sm">
          View Docs
        </ExternalLink>
      </div>

      <div className="p-4 border rounded-md space-y-4">
        <UrlField
          id="relayer-service-url"
          label="Relayer Service URL"
          name="relayerServiceUrl"
          control={control}
          validation={{ required: true }}
          placeholder="https://your-relayer-service.com"
        />

        <PasswordField
          id="relayer-api-key"
          label="API Key"
          name="sessionApiKey"
          control={localControl}
          validation={{ required: true }}
          placeholder="Enter your API key"
          helperText="This key is used for this session only and will not be saved."
        />

        <Button
          onClick={() => {
            void handleFetchRelayers();
          }}
          disabled={isLoading || !sessionApiKey || !relayerServiceUrl}
          type="button"
          variant="outline"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Fetch Relayers
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <SelectField
        id="selected-relayer"
        label="Select a Relayer"
        name="selectedRelayer"
        control={control}
        options={relayerOptions}
        validation={{ required: true }}
        placeholder="Select a relayer from the list"
      />

      {selectedRelayerId && fetchedRelayers.length > 0 && (
        <RelayerDetailsCard
          details={fetchedRelayers.find((r) => r.relayerId === selectedRelayerId)!}
          enhancedDetails={enhancedRelayerDetails}
          loading={loadingEnhancedDetails}
        />
      )}
    </div>
  );
}

RelayerConfiguration.displayName = 'RelayerConfiguration';
