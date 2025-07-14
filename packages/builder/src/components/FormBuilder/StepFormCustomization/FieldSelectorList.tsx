import { Braces, FormInput, Tag } from 'lucide-react';

import type { FormFieldType } from '@openzeppelin/contracts-ui-builder-types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@openzeppelin/contracts-ui-builder-ui';

interface FieldSelectorListProps {
  /**
   * The array of form fields to display
   */
  fields: FormFieldType[];

  /**
   * The currently selected field index
   */
  selectedFieldIndex: number | null;

  /**
   * Callback when a field is selected
   */
  onSelectField: (index: number) => void;
}

/**
 * Component that displays a list of fields with their types and allows selection
 */
export function FieldSelectorList({
  fields,
  selectedFieldIndex,
  onSelectField,
}: FieldSelectorListProps) {
  return (
    <TooltipProvider>
      <div className="col-span-1 space-y-2 border-r pr-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className={`hover:border-primary/50 hover:bg-primary/2 cursor-pointer rounded-md border p-2 transition-colors ${
              selectedFieldIndex === index ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => onSelectField(index)}
          >
            <div className="border-border/70 mb-1.5 flex items-center gap-1.5 border-b pb-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Tag className="text-primary size-3.5 cursor-help" aria-label="Field label" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Field label displayed to users</p>
                </TooltipContent>
              </Tooltip>
              <p className="text-sm font-medium">{field.label}</p>
            </div>
            <div className="bg-muted/20 flex flex-col gap-1 rounded-sm pt-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Braces
                      className="text-muted-foreground size-3.5 cursor-help"
                      aria-label="Function parameter type"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Original contract function parameter type</p>
                  </TooltipContent>
                </Tooltip>
                <code className="bg-muted rounded-sm border px-1 py-0.5 font-mono">
                  {field.originalParameterType}
                </code>
              </div>
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FormInput
                      className="text-muted-foreground size-3.5 cursor-help"
                      aria-label="Form input component"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Converted UI form field component type</p>
                  </TooltipContent>
                </Tooltip>
                <code className="bg-muted rounded-sm border px-1 py-0.5 font-mono">
                  {field.type}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
