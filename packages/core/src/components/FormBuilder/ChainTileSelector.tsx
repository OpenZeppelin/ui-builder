import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { NetworkIcon } from '@web3icons/react';

// Import the Midnight logo SVG
import MidnightLogoSvg from '../../assets/icons/MidnightLogo.svg';

import type { ChainType } from '../../core/types/ContractSchema';

// Mapping of our chain types to web3icons network names
const networkMapping = {
  evm: 'ethereum',
  stellar: 'stellar',
  solana: 'solana',
  // We don't use network mapping for midnight since we have a custom SVG
};

interface ChainTileSelectorProps {
  onChainSelect: (chain: ChainType) => void;
  initialChain?: ChainType;
}

export function ChainTileSelector({ onChainSelect, initialChain = 'evm' }: ChainTileSelectorProps) {
  const [selectedChain, setSelectedChain] = useState<ChainType>(initialChain);

  // Set up react-hook-form (keeping this for consistency with the existing implementation)
  const { setValue } = useForm({
    defaultValues: {
      blockchain: initialChain,
    },
  });

  // Define blockchain options
  const blockchainOptions = [
    {
      value: 'evm' as const,
      label: 'Ethereum (EVM)',
      network: networkMapping.evm,
      customIcon: null,
    },
    {
      value: 'midnight' as const,
      label: 'Midnight',
      network: null,
      customIcon: true, // Used to indicate we need to use the imported SVG
    },
    {
      value: 'stellar' as const,
      label: 'Stellar',
      network: networkMapping.stellar,
      customIcon: null,
    },
    {
      value: 'solana' as const,
      label: 'Solana',
      network: networkMapping.solana,
      customIcon: null,
    },
  ];

  // Handle selection of a blockchain
  const handleSelectChain = useCallback(
    (chain: ChainType) => {
      setSelectedChain(chain);
      setValue('blockchain', chain);
      onChainSelect(chain);
    },
    [setValue, onChainSelect]
  );

  // Update the selected chain when the component mounts
  useEffect(() => {
    handleSelectChain(initialChain);
  }, [initialChain, handleSelectChain]);

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Blockchain</h3>
        <p className="text-muted-foreground text-sm">
          Choose the blockchain network that your contract is deployed on.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {blockchainOptions.map((option) => {
          const isSelected = selectedChain === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelectChain(option.value)}
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
        <h4 className="mb-2 font-medium">About {getChainName(selectedChain)}</h4>
        <p className="text-muted-foreground text-sm">{getChainDescription(selectedChain)}</p>
      </div>
    </div>
  );
}

function getChainName(chain: ChainType): string {
  switch (chain) {
    case 'evm':
      return 'Ethereum (EVM)';
    case 'midnight':
      return 'Midnight';
    case 'stellar':
      return 'Stellar';
    case 'solana':
      return 'Solana';
    default:
      return chain;
  }
}

function getChainDescription(chain: ChainType): string {
  switch (chain) {
    case 'evm':
      return 'Ethereum is a decentralized, open-source blockchain with smart contract functionality. It supports the Ethereum Virtual Machine (EVM) and uses the native cryptocurrency Ether (ETH).';
    case 'midnight':
      return 'Midnight is a data protection blockchain that enables programmable privacy. It allows developers to build applications that shield sensitive data, including wallet addresses and transaction information, while leveraging zero-knowledge proofs for selective disclosure of data.';
    case 'stellar':
      return 'Stellar is a fast, energy-efficient blockchain network designed for real-world financial applications. It enables near-instant global payments at low cost, connects digital assets to traditional finance, and supports smart contracts through Soroban. Its anchor network spans over 180 countries and supports 20+ digital assets.';
    case 'solana':
      return 'Solana is a high-performance blockchain supporting smart contracts. It offers fast transaction times and low fees using a Proof of History consensus mechanism.';
    default:
      return '';
  }
}
