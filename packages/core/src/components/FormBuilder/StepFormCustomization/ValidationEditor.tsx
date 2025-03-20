import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface ValidationEditorProps {
  validationConfig: BuilderFormConfig['validation'];
  onUpdate: (updates: Partial<BuilderFormConfig['validation']>) => void;
}

export function ValidationEditor({ validationConfig, onUpdate }: ValidationEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="validation-mode">Validation Mode</Label>
        <Select
          value={validationConfig.mode}
          onValueChange={(value) => onUpdate({ mode: value as 'onChange' | 'onBlur' | 'onSubmit' })}
        >
          <SelectTrigger id="validation-mode">
            <SelectValue placeholder="Select validation mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="onChange">Validate on Change</SelectItem>
            <SelectItem value="onBlur">Validate on Blur</SelectItem>
            <SelectItem value="onSubmit">Validate on Submit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="validation-display">Error Display</Label>
        <Select
          value={validationConfig.showErrors}
          onValueChange={(value) =>
            onUpdate({ showErrors: value as 'inline' | 'summary' | 'both' })
          }
        >
          <SelectTrigger id="validation-display">
            <SelectValue placeholder="Select error display method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inline">Show errors inline</SelectItem>
            <SelectItem value="summary">Show errors in summary</SelectItem>
            <SelectItem value="both">Show errors in both places</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
