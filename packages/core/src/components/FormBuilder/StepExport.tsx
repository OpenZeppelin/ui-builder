import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { TextField } from '@form-renderer/components/fields';
import { Progress } from '@form-renderer/components/ui';
import { Button } from '@form-renderer/components/ui/button';
import { Label } from '@form-renderer/components/ui/label';

import { FormExportSystem } from '../../export';

import type { ChainType } from '../../core/types/ContractSchema';
import type { BuilderFormConfig } from '../../core/types/FormTypes';
import type { ZipProgress } from '../../export/ZipGenerator';

/**
 * StepExport Component
 *
 * This component handles the final step in the form building process - exporting
 * the created form for use in other applications.
 *
 * The export process uses the complete export pipeline:
 * - FormExportSystem coordinates the entire export process
 * - TemplateManager provides the project template files
 * - FormCodeGenerator creates the React component code
 * - AdapterExportManager includes necessary adapter files
 * - PackageManager handles dependencies in package.json
 * - ZipGenerator creates a downloadable ZIP file
 */
export interface StepExportProps {
  selectedChain: ChainType;
  selectedFunction: string | null;
  formConfig: BuilderFormConfig | null;
  onExport: () => void;
}

export function StepExport({
  selectedChain,
  selectedFunction,
  formConfig,
  onExport,
}: StepExportProps) {
  const [exportType, setExportType] = useState<'npm' | 'standalone'>('standalone');
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportFileName, setExportFileName] = useState<string | null>(null);

  const { control, watch } = useForm({
    defaultValues: {
      packageName: 'my-transaction-form',
    },
  });

  // Get current package name value from form
  const packageName = watch('packageName');

  /**
   * Handle the export process using the complete FormExportSystem
   */
  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);

    try {
      // Only proceed if we have a function and form config
      if (selectedFunction && formConfig) {
        // Initialize the FormExportSystem
        const exportSystem = new FormExportSystem();

        // Export the form with progress reporting
        const result = await exportSystem.exportForm(formConfig, selectedChain, selectedFunction, {
          projectName: packageName,
          description: `Transaction form for ${selectedFunction} function`,
          includeAdapters: true,
          template: 'typescript-react-vite',
          onProgress: (progress: ZipProgress) => {
            // Update progress based on the stage
            if (progress.operation === 'adding') {
              // During file adding phase (0-50%)
              const addingPercent =
                progress.processedFiles && progress.totalFiles
                  ? (progress.processedFiles / progress.totalFiles) * 50
                  : 0;
              setExportProgress(addingPercent);
            } else if (progress.operation === 'compressing') {
              // During compression phase (50-100%)
              setExportProgress(50 + (progress.percent || 0) / 2);
            } else if (progress.percent) {
              // If only percent is provided
              setExportProgress(progress.percent);
            }
          },
        });

        // Create download URL for the ZIP file
        const url = URL.createObjectURL(result.zipBlob);
        setExportUrl(url);
        setExportFileName(result.fileName);

        // Automatically trigger download
        triggerDownload(url, result.fileName);

        // Call the onExport callback to notify parent
        onExport();
      }
    } catch (error) {
      console.error('Error generating form:', error);
      alert(`Export failed: ${(error as Error).message}`);
    } finally {
      setExporting(false);
      setExported(true);
    }
  };

  /**
   * Trigger download of the ZIP file
   */
  const triggerDownload = (url: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /**
   * Download the exported ZIP file again
   */
  const handleDownloadAgain = () => {
    if (exportUrl && exportFileName) {
      triggerDownload(exportUrl, exportFileName);
    }
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

          <TextField
            id="package-name"
            name="packageName"
            label="Package Name"
            placeholder="my-transaction-form"
            control={control}
          />
        </div>

        {/* Export Button */}
        <div className="pt-4">
          <Button
            className="w-full"
            size="lg"
            onClick={() => void handleExport()}
            disabled={exporting || !hasFunction || !formConfigured}
          >
            {exporting ? 'Exporting...' : 'Export Form'}
          </Button>

          {exporting && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Generating export package...</span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          {exported && !exporting && (
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
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadAgain}
                      disabled={!exportUrl}
                    >
                      Download Again
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setExported(false)}>
                      Export Again
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Get a display name for a blockchain type
 * TODO: refactor to not use hardcoded values and follow chain-agnostic design.
 */
function getChainDisplayName(chainType: ChainType): string {
  const displayNames: Record<ChainType, string> = {
    evm: 'Ethereum (EVM)',
    solana: 'Solana',
    stellar: 'Stellar',
    midnight: 'Midnight',
  };

  return displayNames[chainType] || chainType;
}
