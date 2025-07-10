import { NetworkIcon } from '@web3icons/react';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useWalletState } from '@openzeppelin/transaction-form-react-core';
import { Ecosystem } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import MidnightLogoSvg from '../../../../assets/icons/MidnightLogo.svg';
import { getNetworksByEcosystem } from '../../../../core/ecosystemManager';
import {
  getEcosystemDescription,
  getEcosystemName,
  getEcosystemNetworkIconName,
} from '../../../../core/ecosystems/registry';
import { networkService } from '../../../../core/networks/service';
import {
  getEcosystemFeatureConfig,
  getVisibleEcosystems,
  isEcosystemEnabled,
} from '../../../../utils/ecosystem-feature-flags';
import { StepTitleWithDescription } from '../../Common';

import { NetworkSelectionPanel } from './NetworkSelectionPanel';

interface ChainTileSelectorProps {
  onNetworkSelect: (networkConfigId: string | null) => void;
  initialEcosystem?: Ecosystem;
  selectedNetworkId?: string | null;
}

export function ChainTileSelector({
  onNetworkSelect,
  initialEcosystem = 'evm',
  selectedNetworkId = null,
}: ChainTileSelectorProps) {
  const [selectedEcosystem, setSelectedEcosystem] = useState<Ecosystem | null>(null);
  const { activeNetworkId } = useWalletState();

  // Track if we've done the initial auto-selection
  const hasAutoSelectedRef = useRef(false);

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
        logger.info('ChainTileSelector', `Ecosystem ${ecosystem} is disabled, ignoring selection`);
        return;
      }

      setSelectedEcosystem(ecosystem);
      setValue('ecosystem', ecosystem);

      try {
        const networksInEcosystem = await getNetworksByEcosystem(ecosystem);
        onNetworkSelect(networksInEcosystem[0].id);
      } catch (error) {
        logger.error('ChainTileSelector', `Error auto-selecting network for ${ecosystem}:`, error);
        onNetworkSelect(null); // Clear selection on error
      }
    },
    [setValue, onNetworkSelect]
  );

  // Handle network selection
  const handleNetworkSelected = useCallback(
    (networkId: string) => {
      onNetworkSelect(networkId);
    },
    [onNetworkSelect]
  );

  // Initialize with the default ecosystem if it's enabled
  useEffect(() => {
    if (!selectedEcosystem && !selectedNetworkId) {
      // Only set initial ecosystem if it's enabled
      if (isEcosystemEnabled(initialEcosystem)) {
        setSelectedEcosystem(initialEcosystem);
      } else {
        // If initial ecosystem is disabled, find the first enabled one
        const enabledEcosystems = getVisibleEcosystems().filter(isEcosystemEnabled);
        if (enabledEcosystems.length > 0) {
          setSelectedEcosystem(enabledEcosystems[0]);
        }
      }
    }
  }, [initialEcosystem, selectedEcosystem, selectedNetworkId]);

  // Auto-select the first network when initial ecosystem is set
  useEffect(() => {
    // Only auto-select if:
    // 1. We have a selected ecosystem
    // 2. We haven't done the initial auto-selection yet
    // 3. There is no globally active network already
    if (selectedEcosystem && !hasAutoSelectedRef.current && !activeNetworkId) {
      hasAutoSelectedRef.current = true;

      async function autoSelectFirstNetwork(ecosystem: Ecosystem) {
        try {
          const networksInEcosystem = await getNetworksByEcosystem(ecosystem);
          if (networksInEcosystem.length > 0) {
            const firstNetworkId = networksInEcosystem[0].id;

            // If no network is selected, or if the selected network is different, trigger selection
            if (!selectedNetworkId || selectedNetworkId !== firstNetworkId) {
              logger.info(
                'ChainTileSelector',
                `Auto-selecting first network for initial ecosystem ${ecosystem}: ${firstNetworkId}`
              );
              onNetworkSelect(firstNetworkId);
            } else {
              // Even if the network is already selected, trigger the selection to ensure wallet switches
              logger.info(
                'ChainTileSelector',
                `Re-triggering selection for already selected network ${firstNetworkId} to ensure wallet sync`
              );
              onNetworkSelect(firstNetworkId);
            }
          }
        } catch (error) {
          logger.error(
            'ChainTileSelector',
            `Error auto-selecting initial network for ${ecosystem}:`,
            error
          );
        }
      }
      void autoSelectFirstNetwork(selectedEcosystem);
    }
  }, [selectedEcosystem, selectedNetworkId, onNetworkSelect, activeNetworkId]);

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
            console.warn(`Network with ID ${selectedNetworkId} not found`);
            setSelectedEcosystem(initialEcosystem);
            setValue('ecosystem', initialEcosystem);
          }
        } catch (error) {
          console.error('Failed to fetch network details:', error);
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
      <StepTitleWithDescription
        title="Select Blockchain"
        description="Choose the blockchain network that your contract is deployed on."
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Ecosystem Selection Column - Left Side */}
        <div className="w-full md:w-64 space-y-4">
          <h3 className="text-base font-medium">Blockchain Ecosystem</h3>

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
                      <img
                        src={MidnightLogoSvg}
                        alt="Midnight"
                        width={20}
                        height={20}
                        className={isDisabled ? 'opacity-50' : ''}
                      />
                    ) : option.network ? (
                      <NetworkIcon
                        name={option.network}
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
              <div className="flex flex-col space-y-2">
                <h3 className="text-base font-medium">Select Network</h3>
              </div>

              <NetworkSelectionPanel
                ecosystem={selectedEcosystem}
                onNetworkSelected={handleNetworkSelected}
                selectedNetworkId={selectedNetworkId}
              />
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-muted-foreground">
              <p>
                {selectedEcosystem && !isEcosystemEnabled(selectedEcosystem)
                  ? `${getEcosystemName(selectedEcosystem)} support is coming soon`
                  : 'Select a blockchain ecosystem to view available networks'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
