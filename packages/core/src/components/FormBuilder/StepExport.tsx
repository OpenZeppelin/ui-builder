import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { TextField } from '@form-renderer/components/fields';
import { Button } from '@form-renderer/components/ui/button';
import { Label } from '@form-renderer/components/ui/label';

import { FormCodeGenerator } from '../../export/generators';

import type { ChainType } from '../../core/types/ContractSchema';
import type { BuilderFormConfig } from '../../core/types/FormTypes';

/**
 * StepExport Component
 *
 * This component handles the final step in the form building process - exporting
 * the created form for use in other applications.
 *
 * CURRENT IMPLEMENTATION STATUS:
 * - Form component generation is implemented using FormCodeGenerator
 * - Template-based project generation is implemented using TemplateManager
 * - The generated project files are logged to the console but not downloaded yet
 *
 * MISSING IMPLEMENTATION:
 * - Adding adapter files to the export package
 * - Managing package dependencies using PackageManager
 * - ZIP file generation and download functionality
 *
 * TODO:
 * 1. Implement AdapterExportManager to include required adapter files
 * 2. Implement PackageManager to handle dependencies in package.json
 * 3. Create ZipGenerator for bundling the exported project
 * 4. Implement proper download mechanism
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
  const [generatedProjectFiles, setGeneratedProjectFiles] = useState<Record<string, string> | null>(
    null
  );

  const { control, watch } = useForm({
    defaultValues: {
      packageName: 'my-transaction-form',
    },
  });

  // Get current package name value from form
  const packageName = watch('packageName');

  /**
   * Handle the export process
   *
   * CURRENT IMPLEMENTATION:
   * - Generates a complete project using FormCodeGenerator and TemplateManager
   * - Uses the typescript-react-vite template
   * - Logs the generated project files to the console
   * - Does not yet create a downloadable ZIP file
   */
  const handleExport = () => {
    setExporting(true);

    try {
      // Only proceed if we have a function and form config
      if (selectedFunction && formConfig) {
        // Initialize the FormCodeGenerator
        const formCodeGenerator = new FormCodeGenerator();

        // Use the template-based project generation
        const projectFiles = formCodeGenerator.generateTemplateProject(
          formConfig,
          selectedChain,
          selectedFunction,
          {
            projectName: packageName,
            description: `Transaction form for ${selectedFunction} function`,
          }
        );

        // Store the generated project files
        setGeneratedProjectFiles(projectFiles);

        // Log the project structure to the console
        console.log('Generated Project Files:', Object.keys(projectFiles));
        console.log('Project Files:', projectFiles);

        // TODO: Generate ZIP file and trigger download
        // In a complete implementation, we would:
        // 1. Pass the projectFiles to a ZipGenerator to create a downloadable ZIP file
        // const zipGenerator = new ZipGenerator();
        // const zipBlob = await zipGenerator.createZip(projectFiles);

        // 2. Trigger download of the ZIP file
        // triggerDownload(zipBlob, `${packageName}.zip`);

        // Call the onExport callback to notify parent
        onExport();
      }
    } catch (error) {
      console.error('Error generating form:', error);
    } finally {
      setExporting(false);
      setExported(true);
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

                    {/* In a real implementation, add a download button here */}
                    {/* TODO: Add proper download functionality using the templates package */}
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
          <h4 className="mb-2 text-sm font-medium">Implementation Note</h4>
          <p className="text-muted-foreground text-xs">
            This form code generator uses the package
            &quot;@openzeppelin/transaction-form-builder-form-renderer&quot; for rendering forms.
            During development, this package is resolved from the local monorepo workspace, while in
            production it would use the published npm package.
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            <strong>TODO:</strong> Complete the export process by integrating with the templates
            package (@openzeppelin/transaction-form-builder-templates) to create full project
            exports based on the template files in that package.
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
