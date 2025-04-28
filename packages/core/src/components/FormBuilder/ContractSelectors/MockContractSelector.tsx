import { useEffect, useState } from 'react';

import { Button } from '@openzeppelin/transaction-form-renderer';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';

interface MockContractSelectorProps {
  onSelectMock: (mockId: string) => void;
  chainType?: string;
}

interface TempMockInfo {
  id: string;
  name: string;
  chainType: string;
  description?: string;
}

export function MockContractSelector({ onSelectMock, chainType }: MockContractSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mockContracts, setMockContracts] = useState<TempMockInfo[]>([]);

  useEffect(() => {
    // Temp mock list until service is refactored/replaced
    const tempMocks: TempMockInfo[] = [
      {
        id: 'erc20',
        name: 'ERC20 Token',
        chainType: 'evm',
        description: 'Standard ERC20 Fungible Token',
      },
      {
        id: 'erc721',
        name: 'ERC721 NFT',
        chainType: 'evm',
        description: 'Standard ERC721 Non-Fungible Token',
      },
      {
        id: 'input-tester',
        name: 'Input Tester',
        chainType: 'evm',
        description: 'Contract with various input types',
      },
    ];
    setMockContracts(tempMocks);
  }, []);

  // Filter mocks based on the selected chain type
  const filteredMocks = chainType
    ? mockContracts.filter((mock) => mock.chainType === chainType)
    : mockContracts;

  const handleSelectMock = (mockId: string) => {
    onSelectMock(mockId);
    setIsOpen(false); // Close dialog after selection
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Use Mock Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Mock Contract</DialogTitle>
          <DialogDescription>
            Choose a mock contract to use for testing and development purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {mockContracts.length === 0 ? (
            <div className="py-4 text-center">
              No mock contracts available{chainType ? ` for ${chainType}` : ''}.
            </div>
          ) : (
            <div className="grid max-h-[300px] gap-4 overflow-y-auto pr-2">
              {filteredMocks.map((mock) => (
                <div
                  key={mock.id}
                  className="hover:bg-muted cursor-pointer rounded-md border p-4 transition-colors"
                  onClick={() => handleSelectMock(mock.id)}
                >
                  <h3 className="font-medium">{mock.name}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{mock.description}</p>
                  <div className="text-muted-foreground mt-2 text-xs">Chain: {mock.chainType}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
