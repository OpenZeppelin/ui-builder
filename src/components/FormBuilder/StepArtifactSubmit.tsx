import { useState } from 'react';

import { Button } from '../ui/button';

// Define a basic type for ABI items to avoid 'any'
export interface AbiItem {
  type: string;
  name?: string;
  inputs?: Array<{
    name: string;
    type: string;
    internalType?: string;
    indexed?: boolean;
    components?: Array<{
      name: string;
      type: string;
      internalType?: string;
      indexed?: boolean;
    }>;
  }>;
  stateMutability?: string;
  anonymous?: boolean;
  outputs?: Array<{
    name: string;
    type: string;
    internalType?: string;
    components?: Array<{
      name: string;
      type: string;
      internalType?: string;
    }>;
  }>;
}

interface StepArtifactSubmitProps {
  onAbiLoaded: (abi: AbiItem[]) => void;
}

export function StepArtifactSubmit({ onAbiLoaded }: StepArtifactSubmitProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }

    setFileName(file.name);
    // In a real implementation, we would read the file and parse the JSON
    // For this POC, we'll skip that and just simulate loading the mock ABI
  };

  const handleLoadMockData = () => {
    setIsLoading(true);
    setError(null);

    // Simulate API loading
    setTimeout(() => {
      import('../../mocks/EVM_ABI_MOCK.json')
        .then((module) => {
          const mockAbi = module.default;
          onAbiLoaded(mockAbi);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error loading mock ABI:', err);
          setError('Failed to load mock ABI data');
          setIsLoading(false);
        });
    }, 1000);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Upload Contract Artifact</h3>
        <p className="text-muted-foreground text-sm">
          Upload your contract&apos;s ABI JSON file or use our mock data for testing.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Contract ABI</label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label
                htmlFor="file-upload"
                className="hover:bg-muted/50 flex cursor-pointer items-center justify-center rounded-md border border-dashed p-4 transition-colors"
              >
                <div className="flex flex-col items-center gap-1 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="text-muted-foreground h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  <div className="text-muted-foreground text-xs font-medium">
                    {fileName ? fileName : 'Click to upload or drag and drop'}
                  </div>
                </div>
                <input
                  id="file-upload"
                  name="file"
                  type="file"
                  accept=".json"
                  className="sr-only"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            <Button onClick={handleLoadMockData} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Use Mock Data'}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="bg-muted rounded-md p-4">
          <h4 className="mb-2 font-medium">Using Mock Data</h4>
          <p className="text-muted-foreground text-sm">
            For this proof of concept, we&apos;re using pre-configured mock data. In a production
            environment, you would upload your actual contract ABI JSON file. The mock data includes
            various input types to demonstrate the form building capabilities.
          </p>
        </div>
      </div>
    </div>
  );
}
