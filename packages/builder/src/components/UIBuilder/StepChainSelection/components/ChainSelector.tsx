import { NetworkEthereum, NetworkSolana, NetworkStellar } from '@web3icons/react';
import { Clock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Ecosystem } from '@openzeppelin/ui-builder-types';
import { EmptyState, MidnightIcon } from '@openzeppelin/ui-builder-ui';
import { logger } from '@openzeppelin/ui-builder-utils';

import {
  getEcosystemDescription,
  getEcosystemName,
  getEcosystemNetworkIconName,
} from '../../../../core/ecosystems/registry';
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

  // Set up react-hook-form (keeping this for consistency with the existing implementation)
  const { setValue } = useForm({
    defaultValues: {
      ecosystem: initialEcosystem,
    },
  });

  // Define ecosystem options based on visible ecosystems
  const ecosystemOptions = getVisibleEcosystems().map((ecosystem) => {
    const config = getEcosystemFeatureConfig(ecosystem);

    return {
      value: ecosystem,
      label: getEcosystemName(ecosystem),
      network: getEcosystemNetworkIconName(ecosystem) || null,
      customIcon: ecosystem === 'midnight',
      enabled: config.enabled,
      disabledLabel: config.disabledLabel,
      disabledDescription: config.disabledDescription,
    };
  });

  // Handle selection of a blockchain ecosystem
  const handleSelectEcosystem = useCallback(
    async (ecosystem: Ecosystem) => {
      // Check if ecosystem is enabled
      if (!isEcosystemEnabled(ecosystem)) {
        logger.info('ChainSelector', `Ecosystem ${ecosystem} is disabled, ignoring selection`);
        return;
      }

      setSelectedEcosystem(ecosystem);
      setValue('ecosystem', ecosystem);

      // Track ecosystem selection
      trackEcosystemSelection(ecosystem);

      // Remove auto-selection logic - let users manually choose their network
      // This improves UX by not forcing a default network selection
    },
    [setValue, trackEcosystemSelection]
  );

  // Handle network selection
  const handleNetworkSelected = useCallback(
    (networkId: string) => {
      if (selectedEcosystem) {
        // Track network selection
        trackNetworkSelection(networkId, selectedEcosystem);

        onNetworkSelect(selectedEcosystem, networkId);
      }
    },
    [onNetworkSelect, selectedEcosystem, trackNetworkSelection]
  );

  // Keep the selector in sync with the ecosystem provided by the store/UI state
  useEffect(() => {
    const visibleEcosystems = getVisibleEcosystems();

    if (initialEcosystem && visibleEcosystems.includes(initialEcosystem)) {
      setSelectedEcosystem(initialEcosystem);
      setValue('ecosystem', initialEcosystem);
      return;
    }

    // Fallback: pick the first enabled ecosystem if the provided one is hidden
    const enabledFallback = visibleEcosystems.find(isEcosystemEnabled) || null;
    setSelectedEcosystem(enabledFallback ?? null);
    if (enabledFallback) {
      setValue('ecosystem', enabledFallback);
    }
  }, [initialEcosystem, setValue]);

  // If we have a selectedNetworkId and no ecosystem, we need to fetch the network to determine its ecosystem
  useEffect(() => {
    if (selectedNetworkId && !selectedEcosystem) {
      async function fetchNetworkAndSetEcosystem() {
        try {
          // We know selectedNetworkId is not null here because of the condition above
          const network = await networkService.getNetworkById(selectedNetworkId!);
          if (network) {
            setSelectedEcosystem(network.ecosystem);
            setValue('ecosystem', network.ecosystem);
          } else {
            // Fall back to initialEcosystem if network not found
            logger.warn('ChainSelector', `Network with ID ${selectedNetworkId} not found`);
            setSelectedEcosystem(initialEcosystem);
            setValue('ecosystem', initialEcosystem);
          }
        } catch (error) {
          logger.error('ChainSelector', 'Failed to fetch network details:', error);
          // Fall back to initialEcosystem if we can't determine the ecosystem
          setSelectedEcosystem(initialEcosystem);
          setValue('ecosystem', initialEcosystem);
        }
      }

      void fetchNetworkAndSetEcosystem();
    }
  }, [selectedNetworkId, selectedEcosystem, initialEcosystem, setValue]);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Ecosystem Selection Column - Left Side */}
        <div className="w-full md:w-64 space-y-4">
          <div className="flex flex-col space-y-2">
            {ecosystemOptions.map((option) => {
              const isSelected = selectedEcosystem === option.value;
              const isDisabled = !option.enabled;

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
                    {option.value === 'midnight' ? (
                      <MidnightIcon size={20} className={isDisabled ? 'opacity-50' : ''} />
                    ) : option.network ? (
                      option.network === 'ethereum' ? (
                        <NetworkEthereum
                          size={24}
                          variant="branded"
                          className={isDisabled ? 'opacity-50' : ''}
                        />
                      ) : option.network === 'stellar' ? (
                        <NetworkStellar
                          size={24}
                          variant="branded"
                          className={isDisabled ? 'opacity-50' : ''}
                        />
                      ) : option.network === 'solana' ? (
                        <NetworkSolana
                          size={24}
                          variant="branded"
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
                      )
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
          {selectedEcosystem && (
            <div className="bg-muted rounded-md p-3">
              <h4 className="mb-2 font-medium text-sm">
                About {getEcosystemName(selectedEcosystem)}
              </h4>
              <p className="text-muted-foreground text-sm">
                {getEcosystemDescription(selectedEcosystem)}
              </p>
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
                  ? `${getEcosystemName(selectedEcosystem)} Support Coming Soon`
                  : 'Select Blockchain Ecosystem'
              }
              description={
                selectedEcosystem && !isEcosystemEnabled(selectedEcosystem)
                  ? `We're working hard to bring ${getEcosystemName(selectedEcosystem)} support to the platform. Stay tuned for updates!`
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
