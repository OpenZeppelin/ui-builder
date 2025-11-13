import type { ContractAdapter, FormFieldType } from '@openzeppelin/ui-builder-types';
import { Button } from '@openzeppelin/ui-builder-ui';

import type { BuilderFormConfig } from '../../../../core/types/FormTypes';
import { buildInitialMetadata, type ExtendedRuntimeBinding } from '../utils/runtime-secret-helpers';

interface RuntimeSecretButtonProps {
  adapter: ContractAdapter;
  formConfig: BuilderFormConfig;
  onFormConfigUpdated: (config: Partial<BuilderFormConfig>) => void;
}

/**
 * Button to re-add a runtime secret field that was previously removed.
 * This is shown when a function requires a runtime secret but the field has been deleted.
 * Clicking this button will restore the field with adapter-provided configuration.
 */
export function RuntimeSecretButton({
  adapter,
  formConfig,
  onFormConfigUpdated,
}: RuntimeSecretButtonProps) {
  const bindingInfo = adapter.getRuntimeFieldBinding?.();
  if (!bindingInfo) {
    return null;
  }

  const handleReaddRuntimeSecret = () => {
    const binding = bindingInfo as ExtendedRuntimeBinding;
    const metadata = buildInitialMetadata(binding);

    const runtimeSecretField: FormFieldType = {
      id: `runtime-secret-${bindingInfo.key}`,
      name: bindingInfo.key,
      label: bindingInfo.label,
      type: 'runtimeSecret',
      placeholder: 'Enter secret value',
      helperText: bindingInfo.helperText,
      validation: { required: false },
      adapterBinding: {
        key: bindingInfo.key,
        ...(metadata ? { metadata } : {}),
      },
      originalParameterType: 'runtimeSecret',
    };

    const updatedFields = [...formConfig.fields, runtimeSecretField];
    const updatedConfig: BuilderFormConfig = {
      ...formConfig,
      fields: updatedFields,
    };

    onFormConfigUpdated(updatedConfig);
  };

  return (
    <div className="mt-4 border-t pt-4">
      <Button
        variant="outline"
        className="bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900"
        onClick={handleReaddRuntimeSecret}
      >
        + Re-add {bindingInfo.label}
      </Button>
    </div>
  );
}
