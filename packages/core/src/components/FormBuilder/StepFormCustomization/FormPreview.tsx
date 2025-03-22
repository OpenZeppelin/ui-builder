import type { FormFieldType } from '@openzeppelin/transaction-form-renderer';

import { Control, FieldValues, useForm } from 'react-hook-form';

import { SelectField, type SelectOption } from '@form-renderer/components/fields/SelectField';

import { AddressInput } from '../../ui/address-input';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

import type { ChainType, ContractFunction } from '../../../core/types/ContractSchema';
import type { BuilderFormConfig } from '../../../core/types/FormTypes';

// Helper function to render different field types
function renderField(
  field: FormFieldType,
  index: number,
  selectControl: Control<FieldValues>
): React.ReactNode {
  const fieldId = `field-${index}`;

  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
      return (
        <Input
          id={fieldId}
          placeholder={field.placeholder}
          disabled={true}
          type={field.type === 'number' ? 'number' : 'text'}
        />
      );
    case 'textarea':
      return <Textarea id={fieldId} placeholder={field.placeholder} disabled={true} />;
    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox id={fieldId} disabled={true} />
          <Label htmlFor={fieldId}>{field.label}</Label>
        </div>
      );
    case 'select':
      // Create options array for SelectField
      const selectOptions: SelectOption[] =
        field.options?.map((option) => ({
          value: option.value,
          label: option.label,
        })) || [];

      return (
        <SelectField
          id={fieldId}
          name={`previewSelect-${index}`}
          label=""
          placeholder={field.placeholder || 'Select an option'}
          control={selectControl}
          options={selectOptions}
        />
      );
    case 'address':
      return <AddressInput id={fieldId} placeholder={field.placeholder} disabled={true} />;
    default:
      return <Input id={fieldId} placeholder={field.placeholder} disabled={true} />;
  }
}

interface FormPreviewProps {
  formConfig: BuilderFormConfig;
  functionDetails: ContractFunction;
  selectedChain: ChainType;
}

export function FormPreview({ formConfig, functionDetails, selectedChain }: FormPreviewProps) {
  const { control } = useForm();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="mb-1 text-lg font-medium">{functionDetails.name}</h3>
          <p className="text-muted-foreground text-sm">
            {functionDetails.description || 'No description available.'}
          </p>
        </div>

        <div
          className={`grid gap-${
            formConfig.layout.spacing === 'compact'
              ? '4'
              : formConfig.layout.spacing === 'relaxed'
                ? '8'
                : '6'
          } grid-cols-${formConfig.layout.columns}`}
        >
          {formConfig.fields.map((field, index) => (
            <div
              key={index}
              className={`${
                field.width === 'full'
                  ? 'col-span-full'
                  : field.width === 'half'
                    ? 'col-span-1 md:col-span-1'
                    : 'col-span-1'
              }`}
            >
              <div className="flex flex-col gap-2">
                {formConfig.layout.labelPosition !== 'hidden' && (
                  <Label htmlFor={`field-${index}`}>
                    {field.label}
                    {field.validation?.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                )}
                {renderField(field, index, control)}
                {field.helperText && (
                  <p className="text-muted-foreground text-sm">{field.helperText}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button disabled>Submit Transaction</Button>
        </div>
      </CardContent>
    </Card>
  );
}
