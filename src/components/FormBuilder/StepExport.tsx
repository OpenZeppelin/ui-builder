import { useState } from 'react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

import type { ChainType } from '../../core/types/ContractSchema';
import type { FormConfig } from '../../core/types/FormTypes';

export interface StepExportProps {
  selectedChain: ChainType;
  selectedFunction: string | null;
  formConfig: FormConfig | null;
  onExport: () => void;
}

export function StepExport({
  selectedChain,
  selectedFunction,
  formConfig,
  onExport,
}: StepExportProps) {
  const [exportType, setExportType] = useState<'npm' | 'standalone'>('standalone');
  const [packageName, setPackageName] = useState('my-transaction-form');
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    setExporting(true);

    // Simulate export process
    setTimeout(() => {
      onExport();
      setExporting(false);
      setExported(true);
    }, 2000);
  };

  const hasFunction = selectedFunction !== null;
  const formConfigured = formConfig !== null;

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Export Your Form</h3>
        <p className="text-muted-foreground text-sm">
          Configure export settings and generate your transaction form.
        </p>
      </div>

      <div className="space-y-6">
        {/* Export Summary */}
        <div className="bg-muted rounded-md p-4">
          <h4 className="mb-2 font-medium">Form Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Blockchain:</span>
              <span className="font-medium">{getChainDisplayName(selectedChain)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selected Function:</span>
              <span className="font-medium">
                {hasFunction ? selectedFunction || 'None' : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Form Fields:</span>
              <span className="font-medium">
                {formConfigured ? `${formConfig?.fields.length} field(s)` : 'None'}
              </span>
            </div>
            {!hasFunction && (
              <div className="mt-2 text-xs text-red-500">
                Warning: No function selected. Please go back and select a function.
              </div>
            )}
          </div>
        </div>

        {/* Export Configuration */}
        <div className="space-y-4">
          <h4 className="font-medium">Export Configuration</h4>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Export Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={exportType === 'standalone' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setExportType('standalone')}
              >
                Standalone Project
              </Button>
              <Button
                type="button"
                variant={exportType === 'npm' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setExportType('npm')}
              >
                NPM Package
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              {exportType === 'standalone'
                ? 'Export as a complete React project that can be built and deployed.'
                : 'Export as an NPM package that can be installed in an existing project.'}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="package-name" className="text-sm font-medium">
              Package Name
            </Label>
            <Input
              id="package-name"
              type="text"
              placeholder="my-transaction-form"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
            />
          </div>
        </div>

        {/* Export Button */}
        <div className="pt-4">
          <Button
            className="w-full"
            size="lg"
            onClick={handleExport}
            disabled={exporting || exported || !hasFunction || !formConfigured}
          >
            {exporting ? 'Exporting...' : exported ? 'Exported Successfully!' : 'Export Form'}
          </Button>

          {exported && (
            <div className="mt-4 rounded-md bg-green-50 p-4 text-green-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Export Complete</h3>
                  <div className="mt-2 text-sm">
                    <p>
                      Your transaction form has been successfully exported. The file has been
                      downloaded to your browser&apos;s default download location.
                    </p>
                  </div>
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={() => setExported(false)}>
                      Export Again
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="rounded-md border border-dashed p-4">
          <h4 className="mb-2 text-sm font-medium">Note</h4>
          <p className="text-muted-foreground text-xs">
            In this proof of concept, we simulate the export process. In a production version, this
            would generate and bundle the actual form code along with all necessary dependencies for
            the blockchain interaction.
          </p>
        </div>
      </div>
    </div>
  );
}

function getChainDisplayName(chainType: ChainType): string {
  switch (chainType) {
    case 'evm':
      return 'Ethereum (EVM)';
    case 'midnight':
      return 'Midnight';
    case 'stellar':
      return 'Stellar';
    case 'solana':
      return 'Solana';
    default:
      return chainType;
  }
}
