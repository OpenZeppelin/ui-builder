import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { SelectField, type SelectOption } from '@openzeppelin/transaction-form-renderer';

import { getChainName } from '../../core/utils/utils';

import type { ChainType } from '../../core/types/ContractSchema';

interface StepChainSelectProps {
  onChainSelect: (chain: ChainType) => void;
  initialChain?: ChainType;
}

export function StepChainSelect({ onChainSelect, initialChain = 'evm' }: StepChainSelectProps) {
  const [selectedChain, setSelectedChain] = useState<ChainType>(initialChain);

  // Set up react-hook-form
  const { control, watch } = useForm({
    defaultValues: {
      blockchain: initialChain,
    },
  });

  // Create options array for the SelectField
  const blockchainOptions: SelectOption[] = [
    { value: 'evm', label: 'Ethereum (EVM)' },
    { value: 'midnight', label: 'Midnight' },
    { value: 'stellar', label: 'Stellar' },
    { value: 'solana', label: 'Solana' },
  ];

  // Watch the blockchain field for changes
  const blockchainValue = watch('blockchain') as ChainType;

  // Update the selected chain when the form value changes
  useEffect(() => {
    if (blockchainValue && blockchainValue !== selectedChain) {
      setSelectedChain(blockchainValue);
      onChainSelect(blockchainValue);
    }
  }, [blockchainValue, onChainSelect, selectedChain]);

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Blockchain</h3>
        <p className="text-muted-foreground text-sm">
          Choose the blockchain network that your contract is deployed on.
        </p>
      </div>

      <div className="space-y-4">
        <SelectField
          id="blockchain-select"
          name="blockchain"
          label=""
          width="third"
          placeholder="Select a blockchain"
          control={control}
          options={blockchainOptions}
        />

        <div className="bg-muted mt-6 rounded-md p-4">
          <h4 className="mb-2 font-medium">About {getChainName(selectedChain)}</h4>
          <p className="text-muted-foreground text-sm">{getChainDescription(selectedChain)}</p>
        </div>
      </div>
    </div>
  );
}

function getChainDescription(chain: ChainType): string {
  switch (chain) {
    case 'evm':
      return 'Ethereum is a decentralized, open-source blockchain with smart contract functionality. It supports the Ethereum Virtual Machine (EVM) and uses the native cryptocurrency Ether (ETH).';
    case 'midnight':
      return 'Midnight is a privacy-focused sidechain that enables confidential smart contracts. It allows developers to build and deploy privacy-preserving applications.';
    case 'stellar':
      return 'Stellar is an open network for storing and moving money. It allows users to create, send, and trade digital representations of all forms of money.';
    case 'solana':
      return 'Solana is a high-performance blockchain supporting smart contracts. It offers fast transaction times and low fees using a Proof of History consensus mechanism.';
    default:
      return '';
  }
}
