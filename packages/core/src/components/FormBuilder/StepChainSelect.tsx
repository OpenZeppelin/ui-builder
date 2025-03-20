import { useState } from 'react';

import type { ChainType } from '../../core/types/ContractSchema';
import { getChainName } from '../../core/utils/utils';
// UI components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface StepChainSelectProps {
  onChainSelect: (chain: ChainType) => void;
  initialChain?: ChainType;
}

export function StepChainSelect({ onChainSelect, initialChain = 'evm' }: StepChainSelectProps) {
  const [selectedChain, setSelectedChain] = useState<ChainType>(initialChain);

  const handleChainChange = (value: ChainType) => {
    setSelectedChain(value);
    onChainSelect(value);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Blockchain</h3>
        <p className="text-muted-foreground text-sm">
          Choose the blockchain network that your contract is deployed on.
        </p>
      </div>

      <div className="space-y-4">
        <Select value={selectedChain} onValueChange={handleChainChange as (value: string) => void}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Select a blockchain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="evm">Ethereum (EVM)</SelectItem>
            <SelectItem value="midnight">Midnight</SelectItem>
            <SelectItem value="stellar">Stellar</SelectItem>
            <SelectItem value="solana">Solana</SelectItem>
          </SelectContent>
        </Select>

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
