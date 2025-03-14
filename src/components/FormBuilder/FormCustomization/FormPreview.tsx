import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';

import type { ContractFunction } from '../../../core/types/ContractSchema';
import type { FormConfig } from '../../../core/types/FormTypes';

interface FormPreviewProps {
  formConfig: FormConfig;
  functionDetails: ContractFunction;
}

export function FormPreview({ formConfig, functionDetails }: FormPreviewProps) {
  // We're not using useForm() here since this is just a display component

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4 text-xl font-bold">{functionDetails.displayName}</h3>
        <form className="space-y-4">
          <div
            className={`grid gap-4 ${
              formConfig.layout.columns === 1
                ? 'grid-cols-1'
                : formConfig.layout.columns === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
            }`}
          >
            {formConfig.fields.map((field, index) => (
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
                <Label htmlFor={`field-${index}`}>{field.label}</Label>
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
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {field.helperText && (
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
