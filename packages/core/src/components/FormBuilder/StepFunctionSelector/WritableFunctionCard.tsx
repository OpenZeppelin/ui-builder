import { Button } from '@form-renderer/components/ui/button';

import { WritableFunctionCardProps } from './types';

export function WritableFunctionCard({ fn, isSelected, onSelect }: WritableFunctionCardProps) {
  return (
    <div
      className={`rounded-md border p-4 ${
        isSelected ? 'border-primary bg-primary/5' : 'border-muted'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{fn.displayName}</h4>
          <div className="text-muted-foreground mt-1 text-sm">
            {fn.inputs.length > 0 ? (
              <span>
                Parameters: {fn.inputs.map((input) => input.name || input.type).join(', ')}
              </span>
            ) : (
              <span>No parameters</span>
            )}
          </div>
        </div>
        <Button
          variant={isSelected ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(fn.id, fn.modifiesState)}
        >
          {isSelected ? 'Selected' : 'Select'}
        </Button>
      </div>
    </div>
  );
}
