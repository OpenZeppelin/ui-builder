import { AddressInput } from '../../ui/address-input';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';

import type { ChainType, ContractFunction } from '../../../core/types/ContractSchema';
import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import type { FormField } from '@openzeppelin/transaction-form-renderer';

interface FormPreviewProps {
  formConfig: BuilderFormConfig;
  functionDetails: ContractFunction;
  selectedChain: ChainType;
}

export function FormPreview({ formConfig, functionDetails, selectedChain }: FormPreviewProps) {
  // Extract the common form properties for rendering
  const formProperties = formConfig;

  // We're not using useForm() here since this is just a display component
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4 text-xl font-bold">{functionDetails.displayName}</h3>
        <form className="space-y-4">
          <div
            className={`grid gap-4 ${
              formProperties.layout.columns === 1
                ? 'grid-cols-1'
                : formProperties.layout.columns === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
            }`}
          >
            {formProperties.fields.map((field: FormField, index: number) => (
              <div
                key={field.id}
                className={`space-y-2 ${
                  field.width === 'full'
                    ? 'col-span-full'
                    : field.width === 'half'
                      ? 'col-span-1 sm:col-span-1'
                      : 'col-span-1'
                }`}
              >
                {field.type !== 'address' && field.type !== 'checkbox' && (
                  <Label htmlFor={`field-${index}`}>{field.label}</Label>
                )}

                {field.type === 'text' && (
                  <Input id={`field-${index}`} placeholder={field.placeholder} />
                )}
                {field.type === 'number' && (
                  <Input id={`field-${index}`} type="number" placeholder={field.placeholder} />
                )}
                {field.type === 'checkbox' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox id={`field-${index}`} />
                    <Label htmlFor={`field-${index}`}>{field.placeholder}</Label>
                  </div>
                )}
                {field.type === 'textarea' && (
                  <Textarea id={`field-${index}`} placeholder={field.placeholder} />
                )}
                {field.type === 'select' && (
                  <Select>
                    <SelectTrigger id={`field-${index}`}>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option: { label: string; value: string }) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {field.type === 'address' && (
                  <AddressInput
                    id={`field-${index}`}
                    label={field.label}
                    placeholder={field.placeholder || 'Enter blockchain address'}
                    chainType={selectedChain}
                  />
                )}
                {field.helperText && field.type !== 'address' && (
                  <p className="text-muted-foreground text-sm">{field.helperText}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4">
            <Button type="button">Submit Transaction</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
