import type { FormFieldType } from '@openzeppelin/transaction-form-renderer';

import React from 'react';
import { useForm } from 'react-hook-form';

import {
  AddressField,
  AmountField,
  BooleanField,
  NumberField,
  SelectField,
  type SelectOption,
  TextAreaField,
  TextField,
} from '@form-renderer/components/fields';
import { Button } from '@form-renderer/components/ui/button';

import { Card, CardContent } from '../../ui/card';

import type { ChainType, ContractFunction } from '../../../core/types/ContractSchema';
import type { BuilderFormConfig } from '../../../core/types/FormTypes';

interface FormPreviewProps {
  formConfig: BuilderFormConfig;
  functionDetails: ContractFunction;
  selectedChain: ChainType;
}

export function FormPreview({ formConfig, functionDetails, selectedChain }: FormPreviewProps) {
  // Set up form with default values for preview
  const { control } = useForm({
    defaultValues: formConfig.fields.reduce(
      (acc, field, index) => {
        acc[`preview-field-${index}`] = '';
        return acc;
      },
      {} as Record<string, string | boolean>
    ),
  });

  // Helper function to render different field types
  const renderField = (field: FormFieldType, index: number): React.ReactNode => {
    const fieldId = `field-${index}`;
    const fieldName = `preview-field-${index}`;
    const fieldLabel = formConfig.layout.labelPosition === 'hidden' ? '' : field.label;

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <TextField
            id={fieldId}
            name={fieldName}
            label={fieldLabel}
            placeholder={field.placeholder}
            control={control}
            validation={{
              required: field.validation?.required,
            }}
            helperText={field.helperText}
            width={field.width}
          />
        );
      case 'number':
        return (
          <NumberField
            id={fieldId}
            name={fieldName}
            label={fieldLabel}
            placeholder={field.placeholder}
            control={control}
            validation={{
              required: field.validation?.required,
            }}
            helperText={field.helperText}
            width={field.width}
          />
        );
      case 'textarea':
        return (
          <TextAreaField
            id={fieldId}
            name={fieldName}
            label={fieldLabel}
            placeholder={field.placeholder}
            control={control}
            validation={{
              required: field.validation?.required,
            }}
            helperText={field.helperText}
            width={field.width}
          />
        );
      case 'checkbox':
        return (
          <BooleanField
            id={fieldId}
            name={fieldName}
            label={field.label}
            control={control}
            validation={{
              required: field.validation?.required,
            }}
            helperText={field.helperText}
            width={field.width}
          />
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
            name={fieldName}
            label={fieldLabel}
            placeholder={field.placeholder || 'Select an option'}
            control={control}
            options={selectOptions}
            validation={{
              required: field.validation?.required,
            }}
            helperText={field.helperText}
            width={field.width}
          />
        );
      case 'address':
        return (
          <AddressField
            id={fieldId}
            name={fieldName}
            label={fieldLabel}
            placeholder={field.placeholder}
            control={control}
            validation={{
              required: field.validation?.required,
            }}
            helperText={field.helperText}
            width={field.width}
          />
        );
      case 'amount':
        return (
          <AmountField
            id={fieldId}
            name={fieldName}
            label={fieldLabel}
            placeholder={field.placeholder}
            control={control}
            validation={{
              required: field.validation?.required,
            }}
            helperText={field.helperText}
            width={field.width}
          />
        );
      default:
        return (
          <TextField
            id={fieldId}
            name={fieldName}
            label={fieldLabel}
            placeholder={field.placeholder}
            control={control}
            validation={{
              required: field.validation?.required,
            }}
            helperText={field.helperText}
            width={field.width}
          />
        );
    }
  };

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
            <React.Fragment key={index}>{renderField(field, index)}</React.Fragment>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button disabled>Submit Transaction</Button>
        </div>
      </CardContent>
    </Card>
  );
}
