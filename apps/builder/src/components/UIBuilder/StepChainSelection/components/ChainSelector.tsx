import { Clock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { EcosystemIcon, EmptyState } from '@openzeppelin/ui-components';
import { Ecosystem } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { getEcosystemMetadata } from '../../../../core/ecosystemManager';
import { networkService } from '../../../../core/networks/service';
import { useBuilderAnalytics } from '../../../../hooks/useBuilderAnalytics';
import {
  getEcosystemFeatureConfig,
  getVisibleEcosystems,
  isEcosystemEnabled,
} from '../../../../utils/ecosystem-feature-flags';
import { NetworkSelectionPanel } from './NetworkSelectionPanel';

interface ChainSelectorProps {
  onNetworkSelect: (ecosystem: Ecosystem, networkConfigId: string) => void;
  initialEcosystem?: Ecosystem;
  selectedNetworkId?: string | null;
}

export function ChainSelector({
  onNetworkSelect,
  initialEcosystem = 'evm',
  selectedNetworkId = null,
}: ChainSelectorProps) {
  const [selectedEcosystem, setSelectedEcosystem] = useState<Ecosystem | null>(null);
  const { trackEcosystemSelection, trackNetworkSelection } = useBuilderAnalytics();

  const { setValue } = useForm({
    defaultValues: {
      ecosystem: initialEcosystem,
    },
  });

  const ecosystemOptions = getVisibleEcosystems().map((ecosystem) => {
    const config = getEcosystemFeatureConfig(ecosystem);
    const meta = getEcosystemMetadata(ecosystem);

    return {
      value: ecosystem,
      label: meta?.name ?? ecosystem,
      enabled: config.enabled,
      disabledLabel: config.disabledLabel,
      disabledDescription: config.disabledDescription,
    };
  });

  const handleSelectEcosystem = useCallback(
    async (ecosystem: Ecosystem) => {
      if (!isEcosystemEnabled(ecosystem)) {
        logger.info('ChainSelector', `Ecosystem ${ecosystem} is disabled, ignoring selection`);
        return;
      }

      setSelectedEcosystem(ecosystem);
      setValue('ecosystem', ecosystem);
      trackEcosystemSelection(ecosystem);
    },
    [setValue, trackEcosystemSelection]
  );

  const handleNetworkSelected = useCallback(
    (networkId: string) => {
      if (selectedEcosystem) {
        trackNetworkSelection(networkId, selectedEcosystem);
        onNetworkSelect(selectedEcosystem, networkId);
      }
    },
    [onNetworkSelect, selectedEcosystem, trackNetworkSelection]
  );

  useEffect(() => {
    const visibleEcosystems = getVisibleEcosystems();

    if (initialEcosystem && visibleEcosystems.includes(initialEcosystem)) {
      setSelectedEcosystem(initialEcosystem);
      setValue('ecosystem', initialEcosystem);
      return;
    }

    const enabledFallback = visibleEcosystems.find(isEcosystemEnabled) || null;
    setSelectedEcosystem(enabledFallback ?? null);
    if (enabledFallback) {
      setValue('ecosystem', enabledFallback);
    }
  }, [initialEcosystem, setValue]);

  useEffect(() => {
    if (selectedNetworkId && !selectedEcosystem) {
      async function fetchNetworkAndSetEcosystem() {
        try {
          const network = await networkService.getNetworkById(selectedNetworkId!);
          if (network) {
            setSelectedEcosystem(network.ecosystem);
            setValue('ecosystem', network.ecosystem);
          } else {
            logger.warn('ChainSelector', `Network with ID ${selectedNetworkId} not found`);
            setSelectedEcosystem(initialEcosystem);
            setValue('ecosystem', initialEcosystem);
          }
        } catch (error) {
          logger.error('ChainSelector', 'Failed to fetch network details:', error);
          setSelectedEcosystem(initialEcosystem);
          setValue('ecosystem', initialEcosystem);
        }
      }

      void fetchNetworkAndSetEcosystem();
    }
  }, [selectedNetworkId, selectedEcosystem, initialEcosystem, setValue]);

  const selectedDef = selectedEcosystem ? getEcosystemMetadata(selectedEcosystem) : undefined;

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Ecosystem Selection Column - Left Side */}
        <div className="w-full md:w-64 space-y-4">
          <div className="flex flex-col space-y-2">
            {ecosystemOptions.map((option) => {
              const isSelected = selectedEcosystem === option.value;
              const isDisabled = !option.enabled;
              const def = getEcosystemMetadata(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (!isDisabled) {
                      void handleSelectEcosystem(option.value);
                    }
                  }}
                  disabled={isDisabled}
                  className={`flex items-center gap-3 rounded-md border p-3 text-left transition-all ${
                    isDisabled
                      ? 'cursor-not-allowed opacity-60 border-border bg-muted'
                      : `hover:bg-muted ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-primary/20 ring-1'
                            : 'border-border bg-card'
                        }`
                  }`}
                  aria-selected={isSelected}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full">
                    {def ? (
                      <EcosystemIcon
                        ecosystem={{ id: option.value, iconComponent: def.iconComponent }}
                        size={24}
                        className={isDisabled ? 'opacity-50' : ''}
                      />
                    ) : (
                      <div
                        className={`h-6 w-6 rounded-full bg-muted flex items-center justify-center ${isDisabled ? 'opacity-50' : ''}`}
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {option.label.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium ${
                          isSelected && !isDisabled ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {option.label}
                      </span>
                      {isDisabled && option.disabledLabel && (
                        <span className="text-xs px-2 py-1 bg-muted-foreground/20 rounded-full text-muted-foreground">
                          {option.disabledLabel}
                        </span>
                      )}
                    </div>
                    {isDisabled && option.disabledDescription && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.disabledDescription}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Ecosystem Description */}
          {selectedDef && (
            <div className="bg-muted rounded-md p-3">
              <h4 className="mb-2 font-medium text-sm">About {selectedDef.name}</h4>
              <p className="text-muted-foreground text-sm">{selectedDef.description}</p>
            </div>
          )}
        </div>

        {/* Network Selection Panel - Right Side */}
        <div className="flex-1 min-w-0">
          {selectedEcosystem && isEcosystemEnabled(selectedEcosystem) ? (
            <div className="space-y-4">
              <NetworkSelectionPanel
                ecosystem={selectedEcosystem}
                onNetworkSelected={handleNetworkSelected}
                selectedNetworkId={selectedNetworkId}
              />
            </div>
          ) : (
            <EmptyState
              icon={<Clock className="h-6 w-6 text-muted-foreground" />}
              title={
                selectedEcosystem && !isEcosystemEnabled(selectedEcosystem)
                  ? `${selectedDef?.name ?? selectedEcosystem} Support Coming Soon`
                  : 'Select Blockchain Ecosystem'
              }
              description={
                selectedEcosystem && !isEcosystemEnabled(selectedEcosystem)
                  ? `We're working hard to bring ${selectedDef?.name ?? selectedEcosystem} support to the platform. Stay tuned for updates!`
                  : 'Select a blockchain ecosystem above to view available networks and continue building your contract interface.'
              }
              size="default"
            />
          )}
        </div>
      </div>
    </div>
  );
}
