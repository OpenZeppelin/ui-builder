import { useForm } from 'react-hook-form';

import { SelectField, type SelectOption } from '@openzeppelin/transaction-form-renderer';

import type { BuilderFormConfig } from '../../../core/types/FormTypes';

interface ValidationEditorProps {
  validationConfig: BuilderFormConfig['validation'];
  onUpdate: (updates: Partial<BuilderFormConfig['validation']>) => void;
}

export function ValidationEditor({ validationConfig, onUpdate }: ValidationEditorProps) {
  const { control } = useForm({
    defaultValues: {
      mode: validationConfig.mode || 'onChange',
      showErrors: validationConfig.showErrors || 'inline',
    },
  });

  // Options for validation configurations
  const validationModeOptions: SelectOption[] = [
    { value: 'onChange', label: 'Validate on Change' },
    { value: 'onBlur', label: 'Validate on Blur' },
    { value: 'onSubmit', label: 'Validate on Submit' },
  ];

  const errorDisplayOptions: SelectOption[] = [
    { value: 'inline', label: 'Inline (Below Fields)' },
    { value: 'summary', label: 'Summary (Top of Form)' },
    { value: 'both', label: 'Both Inline and Summary' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SelectField
          id="validation-mode"
          name="mode"
          label="Validation Mode"
          control={control}
          options={validationModeOptions}
          placeholder="Select validation mode"
          validateSelect={(value) => {
            onUpdate({ mode: value as 'onChange' | 'onBlur' | 'onSubmit' });
            return true;
          }}
        />

        <SelectField
          id="validation-display"
          name="showErrors"
          label="Error Display Method"
          control={control}
          options={errorDisplayOptions}
          placeholder="Select error display method"
          validateSelect={(value) => {
            onUpdate({ showErrors: value as 'inline' | 'summary' | 'both' });
            return true;
          }}
        />
      </div>
    </div>
  );
}
