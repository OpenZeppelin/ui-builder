import { NetworkIcon } from '@web3icons/react';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Ecosystem } from '@openzeppelin/transaction-form-types';

// Import the Midnight logo SVG
import MidnightLogoSvg from '../../../assets/icons/MidnightLogo.svg';
import { getEcosystemDescription, getEcosystemName } from '../../../core/ecosystems/registry';
import { StepTitleWithDescription } from '../Common';

// Mapping of our chain types to web3icons network names
const networkMapping = {
  evm: 'ethereum',
  stellar: 'stellar',
  solana: 'solana',
  // We don't use network mapping for midnight since we have a custom SVG
};

interface ChainTileSelectorProps {
  onEcosystemSelect: (ecosystem: Ecosystem) => void;
  initialEcosystem?: Ecosystem;
}

export function ChainTileSelector({
  onEcosystemSelect,
  initialEcosystem = 'evm',
}: ChainTileSelectorProps) {
  const [selectedEcosystem, setSelectedEcosystem] = useState<Ecosystem>(initialEcosystem);

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

  // Handle selection of a blockchain
  const handleSelectEcosystem = useCallback(
    (ecosystem: Ecosystem) => {
      setSelectedEcosystem(ecosystem);
      setValue('ecosystem', ecosystem);
      onEcosystemSelect(ecosystem);
    },
    [setValue, onEcosystemSelect]
  );

  // Update the selected ecosystem when the component mounts
  useEffect(() => {
    handleSelectEcosystem(initialEcosystem);
  }, [initialEcosystem, handleSelectEcosystem]);

  return (
    <div className="flex flex-col space-y-6">
      <StepTitleWithDescription
        title="Select Blockchain"
        description="Choose the blockchain network that your contract is deployed on."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {ecosystemOptions.map((option) => {
          const isSelected = selectedEcosystem === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelectEcosystem(option.value)}
              className={`group hover:bg-muted flex flex-col items-center justify-center rounded-lg border p-4 text-center transition-all hover:shadow-md ${isSelected ? 'border-primary bg-primary/5 ring-primary/20 ring-2' : 'border-border bg-card'} `}
              aria-selected={isSelected}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                {option.value === 'midnight' ? (
                  <img src={MidnightLogoSvg} alt="Midnight" width={30} height={30} />
                ) : (
                  <NetworkIcon name={option.network} size={40} variant="branded" />
                )}
              </div>
              <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-muted mt-6 rounded-md p-4">
        <h4 className="mb-2 font-medium">About {getEcosystemName(selectedEcosystem)}</h4>
        <p className="text-muted-foreground text-sm">
          {getEcosystemDescription(selectedEcosystem)}
        </p>
      </div>
    </div>
  );
}
