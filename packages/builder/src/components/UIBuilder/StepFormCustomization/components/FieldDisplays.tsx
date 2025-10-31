import { Braces, FormInput, Lock, Tag, X } from 'lucide-react';

import type { FormFieldType } from '@openzeppelin/ui-builder-types';
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@openzeppelin/ui-builder-ui';

/**
 * Renders the header section of a field selector item
 * Includes icon, label, and optional delete button
 */
export function FieldHeader({
  field,
  onDeleteField,
  index,
}: {
  field: FormFieldType;
  onDeleteField?: (index: number) => void;
  index: number;
}) {
  const isRuntimeSecret = field.type === 'runtimeSecret';

  return (
    <div className="mb-1.5 flex items-center justify-between">
      <div className="flex items-center gap-1.5 border-b border-border/70 pb-1.5 flex-1">
        <Tooltip>
          <TooltipTrigger asChild>
            {isRuntimeSecret ? (
              <Lock
                className="text-amber-600 size-3.5 cursor-help"
                aria-label="Runtime credential"
              />
            ) : (
              <Tag className="text-primary size-3.5 cursor-help" aria-label="Field label" />
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isRuntimeSecret
                ? 'Runtime credential (required for execution)'
                : 'Field label displayed to users'}
            </p>
          </TooltipContent>
        </Tooltip>
        <p className={`text-sm font-medium ${isRuntimeSecret ? 'text-amber-700' : ''}`}>
          {field.label}
        </p>
      </div>
      {isRuntimeSecret && onDeleteField && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteField(index);
          }}
          aria-label="Remove runtime secret field"
          title="Remove runtime secret field (can be re-added if needed)"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

/**
 * Renders a runtime secret field with explanatory info box
 */
export function RuntimeSecretFieldDisplay() {
  return (
    <div className="bg-amber-50/50 border border-amber-200/50 flex flex-col gap-1.5 rounded-sm p-2 text-xs">
      <p className="text-amber-700 font-medium">Runtime Credential</p>
      <p className="text-amber-600 text-xs">
        Requested at execution time for functions requiring a runtime secret. Never stored locally.
      </p>
    </div>
  );
}

/**
 * Renders a standard parameter-based field with type information
 */
export function ParameterFieldDisplay({ field }: { field: FormFieldType }) {
  return (
    <TooltipProvider>
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
          <code className="bg-muted rounded-sm border px-1 py-0.5 font-mono">{field.type}</code>
        </div>
      </div>
    </TooltipProvider>
  );
}
