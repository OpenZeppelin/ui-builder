import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

import type { FormConfig } from '../../../core/types/FormTypes';

interface LayoutEditorProps {
  layoutConfig: FormConfig['layout'];
  onUpdate: (updates: Partial<FormConfig['layout']>) => void;
}

export function LayoutEditor({ layoutConfig, onUpdate }: LayoutEditorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="layout-columns">Layout Columns</Label>
          <Select
            value={layoutConfig.columns.toString()}
            onValueChange={(value) => onUpdate({ columns: parseInt(value) })}
          >
            <SelectTrigger id="layout-columns">
              <SelectValue placeholder="Select number of columns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Single Column</SelectItem>
              <SelectItem value="2">Two Columns</SelectItem>
              <SelectItem value="3">Three Columns</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="layout-spacing">Field Spacing</Label>
          <Select
            value={layoutConfig.spacing}
            onValueChange={(value) =>
              onUpdate({
                spacing: value as FormConfig['layout']['spacing'],
              })
            }
          >
            <SelectTrigger id="layout-spacing">
              <SelectValue placeholder="Select field spacing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="relaxed">Relaxed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="layout-labels">Label Position</Label>
          <Select
            value={layoutConfig.labelPosition}
            onValueChange={(value) =>
              onUpdate({
                labelPosition: value as FormConfig['layout']['labelPosition'],
              })
            }
          >
            <SelectTrigger id="layout-labels">
              <SelectValue placeholder="Select label position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
