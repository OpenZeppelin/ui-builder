import { Download } from 'lucide-react';

import { useMemo } from 'react';

import { LoadingButton } from '@openzeppelin/transaction-form-renderer';
import type {
  ChainType,
  ContractFunction,
  ContractSchema,
} from '@openzeppelin/transaction-form-types/contracts';

import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import { StepTitleWithDescription } from '../Common';
import { FormPreview } from '../StepFormCustomization/FormPreview';

/**
 * StepComplete Component
 *
 * This component handles the final step in the form building process - presenting
 * the created form for use and allowing the user to export it if desired.
 *
 * The export process uses the complete export pipeline:
 * - FormExportSystem coordinates the entire export process
 * - TemplateManager provides the project template files
 * - FormCodeGenerator creates the React component code
 * - AdapterExportManager includes necessary adapter files
 * - PackageManager handles dependencies in package.json
 * - ZipGenerator creates a downloadable ZIP file
 */
export interface StepCompleteProps {
  selectedChain: ChainType;
  formConfig: BuilderFormConfig | null;
  contractSchema: ContractSchema | null;
  onExport: () => void;
  exportLoading?: boolean;
  functionDetails?: ContractFunction | null;
}

export function StepComplete({
  selectedChain,
  formConfig,
  contractSchema,
  onExport,
  exportLoading,
  functionDetails,
}: StepCompleteProps) {
  // Find the selected function details using memoization
  const selectedFunctionDetails = useMemo(() => {
    if (!functionDetails) return null;
    return functionDetails;
  }, [functionDetails]);

  if (!formConfig || !selectedFunctionDetails || !contractSchema) {
    return (
      <div className="py-8 text-center">
        <p>Please complete the previous steps to build your form.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StepTitleWithDescription
        title="Complete"
        description={<>Your form is ready! You can use it below or export it for use elsewhere.</>}
      />
      <div className="flex justify-end space-x-2">
        <LoadingButton
          variant="default"
          size="sm"
          onClick={onExport}
          className="gap-2"
          loading={exportLoading}
        >
          <Download size={16} />
          <span>Export</span>
        </LoadingButton>
      </div>
      <FormPreview
        formConfig={formConfig}
        functionDetails={selectedFunctionDetails}
        selectedChain={selectedChain}
        contractSchema={contractSchema}
      />
    </div>
  );
}
