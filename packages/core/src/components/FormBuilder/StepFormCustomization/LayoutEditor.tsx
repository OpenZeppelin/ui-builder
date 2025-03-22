import { useForm } from 'react-hook-form';

import { SelectField, type SelectOption } from '@form-renderer/components/fields/SelectField';

import type { BuilderFormConfig } from '../../../core/types/FormTypes';

interface LayoutEditorProps {
  layoutConfig: BuilderFormConfig['layout'];
  onUpdate: (updates: Partial<BuilderFormConfig['layout']>) => void;
}

export function LayoutEditor({ layoutConfig, onUpdate }: LayoutEditorProps) {
  const { control } = useForm({
    defaultValues: {
      columns: String(layoutConfig.columns || '1'),
      spacing: layoutConfig.spacing || 'normal',
      labelPosition: layoutConfig.labelPosition || 'top',
    },
  });

  // Options for layout configurations
  const columnsOptions: SelectOption[] = [
    { value: '1', label: 'Single Column' },
    { value: '2', label: 'Two Columns' },
    { value: '3', label: 'Three Columns' },
  ];

  const spacingOptions: SelectOption[] = [
    { value: 'compact', label: 'Compact' },
    { value: 'normal', label: 'Normal' },
    { value: 'relaxed', label: 'Relaxed' },
  ];

  const labelPositionOptions: SelectOption[] = [
    { value: 'top', label: 'Top' },
    { value: 'left', label: 'Left' },
    { value: 'hidden', label: 'Hidden' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SelectField
          id="layout-columns"
          name="columns"
          label="Number of Columns"
          control={control}
          options={columnsOptions}
          placeholder="Select number of columns"
          validateSelect={(value) => {
            onUpdate({ columns: parseInt(value, 10) });
            return true;
          }}
        />

        <SelectField
          id="layout-spacing"
          name="spacing"
          label="Field Spacing"
          control={control}
          options={spacingOptions}
          placeholder="Select field spacing"
          validateSelect={(value) => {
            onUpdate({ spacing: value as 'compact' | 'normal' | 'relaxed' });
            return true;
          }}
        />

        <SelectField
          id="layout-labels"
          name="labelPosition"
          label="Label Position"
          control={control}
          options={labelPositionOptions}
          placeholder="Select label position"
          validateSelect={(value) => {
            onUpdate({ labelPosition: value as 'top' | 'left' | 'hidden' });
            return true;
          }}
        />
      </div>
    </div>
  );
}
