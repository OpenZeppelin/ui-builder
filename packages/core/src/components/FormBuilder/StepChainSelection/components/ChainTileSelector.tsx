import { NetworkIcon } from '@web3icons/react';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Ecosystem } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import MidnightLogoSvg from '../../../../assets/icons/MidnightLogo.svg';
import { getNetworksByEcosystem } from '../../../../core/ecosystemManager';
import { getEcosystemDescription, getEcosystemName } from '../../../../core/ecosystems/registry';
import { networkService } from '../../../../core/networks/service';
import { StepTitleWithDescription } from '../../Common';

import { NetworkSelectionPanel } from './NetworkSelectionPanel';

// Mapping of our chain types to web3icons network names
const networkMapping = {
  evm: 'ethereum',
  stellar: 'stellar',
  solana: 'solana',
  // We don't use network mapping for midnight since we have a custom SVG
};

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

  // Set up react-hook-form (keeping this for consistency with the existing implementation)
  const { setValue } = useForm({
    defaultValues: {
      ecosystem: initialEcosystem,
    },
  });

  // Define ecosystem options
  const ecosystemOptions = [
    {
      value: 'evm' as const,
      label: getEcosystemName('evm'),
      network: networkMapping.evm,
      customIcon: null,
    },
    {
      value: 'midnight' as const,
      label: getEcosystemName('midnight'),
      network: null,
      customIcon: true, // Used to indicate we need to use the imported SVG
    },
    {
      value: 'stellar' as const,
      label: getEcosystemName('stellar'),
      network: networkMapping.stellar,
      customIcon: null,
    },
    {
      value: 'solana' as const,
      label: getEcosystemName('solana'),
      network: networkMapping.solana,
      customIcon: null,
    },
  ];

  // Handle selection of a blockchain ecosystem
  const handleSelectEcosystem = useCallback(
    async (ecosystem: Ecosystem) => {
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

  // Initialize with the default ecosystem
  useEffect(() => {
    if (!selectedEcosystem && !selectedNetworkId) {
      setSelectedEcosystem(initialEcosystem);
    }
  }, [initialEcosystem, selectedEcosystem, selectedNetworkId]);

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

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    void handleSelectEcosystem(option.value);
                  }}
                  className={`hover:bg-muted flex items-center gap-3 rounded-md border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-primary/20 ring-1'
                      : 'border-border bg-card'
                  }`}
                  aria-selected={isSelected}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full">
                    {option.value === 'midnight' ? (
                      <img src={MidnightLogoSvg} alt="Midnight" width={20} height={20} />
                    ) : (
                      <NetworkIcon name={option.network} size={24} variant="branded" />
                    )}
                  </div>
                  <span
                    className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}
                  >
                    {option.label}
                  </span>
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
          {selectedEcosystem ? (
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
              <p>Select a blockchain ecosystem to view available networks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
