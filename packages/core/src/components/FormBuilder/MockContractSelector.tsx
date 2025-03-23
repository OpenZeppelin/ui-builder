import React, { useEffect, useState } from 'react';

import { Button } from '@form-renderer/components/ui/button';

import { MockContractInfo, MockContractService } from '../../services/MockContractService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface MockContractSelectorProps {
  onSelectMock: (mockId: string) => void;
  chainType?: string;
}

export const MockContractSelector: React.FC<MockContractSelectorProps> = ({
  onSelectMock,
  chainType,
}) => {
  const [mockContracts, setMockContracts] = useState<MockContractInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const loadMockContracts = async () => {
      setIsLoading(true);
      try {
        const mocks = await MockContractService.getAvailableMocks();

        // Filter by chain type if provided
        const filteredMocks = chainType
          ? mocks.filter((mock) => mock.chainType === chainType)
          : mocks;

        setMockContracts(filteredMocks);
        setError(null);
      } catch (err) {
        setError('Failed to load mock contracts');
        console.error('Error loading mock contracts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Call the async function and handle any unexpected errors
    loadMockContracts().catch((err) => {
      console.error('Unexpected error in loadMockContracts:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
    });
  }, [chainType]);

  const handleSelectMock = (mockId: string) => {
    onSelectMock(mockId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          {isLoading ? (
            <div className="flex justify-center py-4">Loading mock contracts...</div>
          ) : error ? (
            <div className="py-2 text-red-500">{error}</div>
          ) : mockContracts.length === 0 ? (
            <div className="py-4 text-center">
              No mock contracts available{chainType ? ` for ${chainType}` : ''}.
            </div>
          ) : (
            <div className="grid max-h-[300px] gap-4 overflow-y-auto pr-2">
              {mockContracts.map((mock) => (
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
